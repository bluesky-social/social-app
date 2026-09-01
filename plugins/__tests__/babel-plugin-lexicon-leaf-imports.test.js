/*
 * Tests for babel-plugin-lexicon-leaf-imports, in three layers:
 *
 * 1. Transform unit tests: run the plugin alone over small snippets against
 *    the real src/lexicons tree and assert the rewrite / bail behavior.
 *
 * 2. App-source proof: enumerate every chain reachable through the barrels'
 *    own `export * as` graph (the only chains user code can write), generate
 *    a probe file referencing all of them, transform it, and typecheck the
 *    output with the app tsconfig. This proves every rewritten specifier
 *    resolves to a real module. The transform itself also exercises the
 *    plugin's verifyChain proof for every single chain.
 *
 * 3. SDK dist proof: the plugin also rewrites @bsky/sdk's compiled output
 *    (plain JS). Transform every dist file that imports the lexicon barrel
 *    and typecheck the result with checkJs, where imports resolve to the
 *    SDK's shipped .d.ts files - so unresolvable specifiers (TS2307) and
 *    missing members on a rewritten leaf namespace (TS2339) both surface.
 *    tsc never checks JS under node_modules, so transformed files are
 *    written to a temp mirror and resolved back into the real dist via
 *    rootDirs. checkJs has inherent noise on compiled output, so the shadow
 *    diagnostics are compared against a baseline run of the untransformed
 *    files: only diagnostics introduced by the plugin fail the test.
 */
const {transformSync} = require('@babel/core')
const {parse} = require('@babel/parser')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {Worker} = require('node:worker_threads')
const ts = require('typescript')

const plugin = require('../babel-plugin-lexicon-leaf-imports')
const {barrelExports, resolveModuleFile} = require('../lexiconBarrels')

const ROOT = path.resolve(__dirname, '../..')
const LEXICONS_ROOT = path.join(ROOT, 'src', 'lexicons')
const SDK_DIST = path.join(ROOT, 'node_modules', '@bsky', 'sdk', 'dist')

const TYPECHECK_TIMEOUT_MS = 240_000

function applyPlugin(code, filename) {
  return transformSync(code, {
    filename,
    configFile: false,
    babelrc: false,
    parserOpts: {plugins: ['typescript']},
    plugins: [[plugin, {roots: [LEXICONS_ROOT]}]],
  }).code
}

/** A virtual .ts path inside src/ - the file itself never exists on disk. */
const PROBE_FILE = path.join(ROOT, 'src', '__lexicon_leaf_probe__.ts')

describe('transform', () => {
  test('rewrites a barrel member chain to a leaf namespace import', () => {
    const out = applyPlugin(
      `import {app} from './lexicons'\nvoid app.bsky.feed.like\n`,
      PROBE_FILE,
    )
    expect(out).toContain(
      `import * as _lex_app_bsky_feed_like from "./lexicons/app/bsky/feed/like"`,
    )
    expect(out).toContain('void _lex_app_bsky_feed_like')
    expect(out).not.toContain(`from './lexicons'`)
  })

  test('bails when the namespace is used as a value', () => {
    const src = `import {app} from './lexicons'\nconsole.log(app)\n`
    const out = applyPlugin(src, PROBE_FILE)
    expect(out).toContain(`from './lexicons'`)
    expect(out).not.toContain('import *')
  })

  test('bails when the chain stops at a non-leaf barrel', () => {
    const src = `import {app} from './lexicons'\nvoid app.bsky\n`
    const out = applyPlugin(src, PROBE_FILE)
    expect(out).toContain(`from './lexicons'`)
    expect(out).not.toContain('import *')
  })

  test('bails when the chain is a write target', () => {
    const writes = [
      'app.bsky.feed.like = 1',
      'app.bsky.feed.like++',
      'delete app.bsky.feed.like',
      'for (app.bsky.feed.like of []) {}',
      ';[app.bsky.feed.like] = []',
      ';({x: app.bsky.feed.like} = {})',
    ]
    for (const stmt of writes) {
      const out = applyPlugin(
        `import {app} from './lexicons'\n${stmt}\n`,
        PROBE_FILE,
      )
      expect(out).toContain(`from './lexicons'`)
      expect(out).not.toContain('import *')
    }
  })

  test('rewrites a read of a leaf even when a sibling member is written', () => {
    const out = applyPlugin(
      `import {app} from './lexicons'\ndelete app.bsky.feed.like.$cached\n`,
      PROBE_FILE,
    )
    expect(out).toContain('delete _lex_app_bsky_feed_like.$cached')
    expect(out).not.toContain(`from './lexicons'`)
  })

  test('leaves type-only imports untouched', () => {
    const src = `import type {app} from './lexicons'\nexport type T = typeof app\n`
    const out = applyPlugin(src, PROBE_FILE)
    expect(out).toContain(`from './lexicons'`)
    expect(out).not.toContain('import *')
  })

  test('inserts leaf imports at the barrel import position, not the top', () => {
    const out = applyPlugin(
      `import './setup'\nimport {app} from './lexicons'\nvoid app.bsky.feed.like\n`,
      PROBE_FILE,
    )
    const setupAt = out.indexOf(`'./setup'`)
    const leafAt = out.indexOf('import * as _lex_app_bsky_feed_like')
    expect(setupAt).toBeGreaterThanOrEqual(0)
    expect(leafAt).toBeGreaterThan(setupAt)
    expect(out).not.toContain(`from './lexicons'`)
  })

  test('ignores imports that are not lexicon barrels', () => {
    const src = `import {app} from './other'\nvoid app.bsky.feed.like\n`
    const out = applyPlugin(src, PROBE_FILE)
    expect(out).toContain(`from './other'`)
    expect(out).toContain('void app.bsky.feed.like')
    expect(out).not.toContain('import *')
  })
})

/*
 * The plugin memoizes filesystem stats, barrel export maps, and verified
 * chains in module-level caches that outlive individual transforms. A lexicon
 * regen inside a long-lived worker (Metro dev server, jest --watch) must
 * invalidate them - the plugin uses the root index mtime as the epoch.
 */
describe('cache invalidation across a lexicon regen', () => {
  let tmp
  let lexRoot

  function write(rel, content) {
    const file = path.join(tmp, rel)
    fs.mkdirSync(path.dirname(file), {recursive: true})
    fs.writeFileSync(file, content)
  }

  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lexicon-regen-'))
    lexRoot = path.join(tmp, 'lexicons')
    write('lexicons/index.ts', `export * as app from './app'\n`)
    write('lexicons/app.ts', `export * as bsky from './app/bsky'\n`)
    write('lexicons/app/bsky.ts', `export * as feed from './bsky/feed'\n`)
    write('lexicons/app/bsky/feed.ts', `export * as like from './feed/like'\n`)
    write('lexicons/app/bsky/feed/like.ts', `export const $type = 'test'\n`)
  })

  afterAll(() => {
    fs.rmSync(tmp, {recursive: true, force: true})
  })

  function transform() {
    return transformSync(
      `import {app} from './lexicons'\nvoid app.bsky.feed.like\n`,
      {
        filename: path.join(tmp, 'consumer.ts'),
        configFile: false,
        babelrc: false,
        parserOpts: {plugins: ['typescript']},
        plugins: [[plugin, {roots: [lexRoot]}]],
      },
    ).code
  }

  test('a layout change is picked up without a process restart', () => {
    expect(transform()).toContain(
      `import * as _lex_app_bsky_feed_like from "./lexicons/app/bsky/feed/like"`,
    )

    /*
     * Simulate `lex build --clear` deepening the leaf into a barrel. Codegen
     * rewrites the whole tree, so the root index mtime always moves; force it
     * forward explicitly since same-millisecond writes would hide the change.
     */
    write(
      'lexicons/app/bsky/feed/like.ts',
      `export * as main from './like/main'\n`,
    )
    write('lexicons/app/bsky/feed/like/main.ts', `export const $type = 'test'\n`)
    const bumped = new Date(Date.now() + 10_000)
    fs.utimesSync(path.join(lexRoot, 'index.ts'), bumped, bumped)

    /*
     * The chain now stops at a barrel, so the correct result is a bail that
     * keeps the barrel import. Stale caches would instead replay the rewrite
     * against the old layout.
     */
    const out = transform()
    expect(out).toContain(`from './lexicons'`)
    expect(out).not.toContain('import *')
  })
})

/**
 * Enumerate every leaf chain by following `export * as <name> from '...'`
 * through the barrel graph, mirroring the plugin's own leaf/barrel rule: a
 * target with a sibling directory is a barrel to recurse into, otherwise a
 * leaf. Chains come out as e.g. ['app', 'bsky', 'feed', 'like'].
 */
function collectLeafChains(rootDir) {
  const chains = []

  function resolveTarget(fromFile, spec) {
    const abs = resolveModuleFile(fromFile, spec)
    if (!abs) throw new Error(`cannot resolve '${spec}' from ${fromFile}`)
    return abs
  }

  function walk(barrelFile, segments) {
    const exports = barrelExports(barrelFile)
    if (!exports) {
      throw new Error(`${barrelFile} is not a pure namespace barrel`)
    }
    for (const [name, spec] of exports) {
      const target = resolveTarget(barrelFile, spec)
      const asDir = target.replace(/\.(ts|js)$/, '')
      if (fs.existsSync(asDir) && fs.statSync(asDir).isDirectory()) {
        walk(target, [...segments, name])
      } else {
        chains.push([...segments, name])
      }
    }
  }

  walk(resolveTarget(path.join(rootDir, 'index.ts'), './index'), [])
  return chains
}

function formatDiagnostics(diags) {
  return diags
    .slice(0, 20)
    .map(d => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ')
      if (d.file && d.start !== undefined) {
        const {line} = d.file.getLineAndCharacterOfPosition(d.start)
        return `${d.file.fileName}:${line + 1} TS${d.code}: ${msg}`
      }
      return `TS${d.code}: ${msg}`
    })
    .join('\n')
}

function fileDiagnostics(program, sourceFile) {
  return [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ].filter(d => d.category === ts.DiagnosticCategory.Error)
}

function loadAppCompilerOptions() {
  const configPath = path.join(ROOT, 'tsconfig.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile).config
  const parsed = ts.parseJsonConfigFileContent(
    {...config, include: [], files: []},
    ts.sys,
    ROOT,
    undefined,
    configPath,
  )
  return {...parsed.options, noEmit: true, skipLibCheck: true}
}

/** A CompilerHost serving in-memory content for the paths in `overlays`. */
function createOverlayHost(options, overlays) {
  const host = ts.createCompilerHost(options)
  const origGetSourceFile = host.getSourceFile.bind(host)
  const origFileExists = host.fileExists.bind(host)
  const origReadFile = host.readFile.bind(host)
  host.fileExists = f => overlays.has(f) || origFileExists(f)
  host.readFile = f => overlays.get(f) ?? origReadFile(f)
  host.getSourceFile = (f, lang, ...rest) =>
    overlays.has(f)
      ? ts.createSourceFile(f, overlays.get(f), lang)
      : origGetSourceFile(f, lang, ...rest)
  return host
}

describe('app sources: every barrel chain rewrites and typechecks', () => {
  test(
    'probe referencing all leaf chains',
    () => {
      const chains = collectLeafChains(LEXICONS_ROOT)
      /* The tree is large; a sudden collapse means the walker broke. */
      expect(chains.length).toBeGreaterThan(100)

      const barrelRoots = [...new Set(chains.map(c => c[0]))]
      const probeSource =
        `import {${barrelRoots.join(', ')}} from './lexicons'\n` +
        chains.map(c => `void ${c.join('.')}`).join('\n') +
        '\n'

      /*
       * This also runs the plugin's verifyChain proof for every chain: any
       * filesystem/barrel divergence throws here.
       */
      const out = applyPlugin(probeSource, PROBE_FILE)

      expect(out).not.toContain(`from './lexicons'`)
      const leafImports = out.match(/from "\.\/lexicons\//g) ?? []
      expect(leafImports).toHaveLength(chains.length)

      /*
       * Typecheck the transformed probe with the app tsconfig. The probe is
       * overlaid at a virtual path inside src/ so its relative leaf imports
       * resolve against the real tree.
       */
      const options = loadAppCompilerOptions()
      const host = createOverlayHost(options, new Map([[PROBE_FILE, out]]))
      const program = ts.createProgram([PROBE_FILE], options, host)
      const probeSf = program.getSourceFile(PROBE_FILE)
      expect(probeSf).toBeDefined()
      const errors = fileDiagnostics(program, probeSf)
      if (errors.length > 0) {
        throw new Error(
          `transformed probe has type errors:\n${formatDiagnostics(errors)}`,
        )
      }

      /*
       * Canary: prove this program setup actually flags a bad specifier, so
       * a broken overlay host cannot produce a vacuous pass.
       */
      const canary =
        out + `import * as _bad from './lexicons/app/bsky/feed/__nope__'\n`
      const canaryHost = createOverlayHost(
        options,
        new Map([[PROBE_FILE, canary]]),
      )
      const canaryProgram = ts.createProgram([PROBE_FILE], options, canaryHost)
      const canaryDiags = fileDiagnostics(
        canaryProgram,
        canaryProgram.getSourceFile(PROBE_FILE),
      )
      expect(canaryDiags.map(d => d.code)).toContain(2307)
    },
    TYPECHECK_TIMEOUT_MS,
  )
})

describe('@bsky/sdk dist: rewrites typecheck against shipped .d.ts', () => {
  let tmpDir

  afterAll(() => {
    if (tmpDir) fs.rmSync(tmpDir, {recursive: true, force: true})
  })

  function findBarrelImporters(dir) {
    const found = []
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        found.push(...findBarrelImporters(full))
      } else if (
        entry.name.endsWith('.js') &&
        /^import[^\n]*['"][^'"]*lexicons\/index\.js['"]/m.test(
          fs.readFileSync(full, 'utf8'),
        )
      ) {
        found.push(full)
      }
    }
    return found
  }

  test(
    'transformed dist files introduce no new diagnostics',
    () => {
      const importers = findBarrelImporters(SDK_DIST)
      expect(importers.length).toBeGreaterThan(0)

      const transformed = []
      for (const file of importers) {
        const code = fs.readFileSync(file, 'utf8')
        /* Real filename so the plugin's @bsky/sdk path detection triggers. */
        const out = applyPlugin(code, file)
        if (out.trim() !== code.trim()) {
          transformed.push({file, original: code, shadow: out})
        }
      }
      expect(transformed.length).toBeGreaterThan(0)

      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lexicon-leafcheck-'))
      const mirrors = {
        shadow: path.join(tmpDir, 'shadow'),
        baseline: path.join(tmpDir, 'baseline'),
      }

      for (const kind of ['shadow', 'baseline']) {
        fs.mkdirSync(mirrors[kind], {recursive: true})
        fs.writeFileSync(
          path.join(mirrors[kind], 'package.json'),
          '{"type": "module"}\n',
        )
      }
      const mirrorPath = (kind, file) =>
        path.join(mirrors[kind], 'dist', path.relative(SDK_DIST, file))
      for (const {file, original, shadow} of transformed) {
        for (const [kind, code] of [
          ['shadow', shadow],
          ['baseline', original],
        ]) {
          const dest = mirrorPath(kind, file)
          fs.mkdirSync(path.dirname(dest), {recursive: true})
          fs.writeFileSync(dest, code)
        }
      }

      function diagnose(kind) {
        const options = {
          allowJs: true,
          checkJs: true,
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          /*
           * Relative imports in the mirror (both untouched ones like
           * './api.js' and the plugin's '../lexicons/...' rewrites) resolve
           * into the real dist, landing on its .d.ts files.
           */
          rootDirs: [path.join(mirrors[kind], 'dist'), SDK_DIST],
        }
        const roots = transformed.map(t => mirrorPath(kind, t.file))
        const program = ts.createProgram(roots, options)
        const byFile = new Map()
        for (const t of transformed) {
          const sf = program.getSourceFile(mirrorPath(kind, t.file))
          if (!sf) {
            throw new Error(`${mirrorPath(kind, t.file)} missing from program`)
          }
          byFile.set(t.file, fileDiagnostics(program, sf))
        }
        return byFile
      }

      /*
       * Canary: prove the checkJs machinery actually checks members through
       * the SDK's .d.ts files. If this setup ever degrades to not-checking,
       * a real regression would pass silently - so require a known-bad
       * member access to be flagged.
       */
      {
        const canary = path.join(mirrors.shadow, 'dist', '__canary__.js')
        fs.writeFileSync(
          canary,
          `import * as leaf from './lexicons/index.js'\nvoid leaf.__does_not_exist__\n`,
        )
        const options = {
          allowJs: true,
          checkJs: true,
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          rootDirs: [path.join(mirrors.shadow, 'dist'), SDK_DIST],
        }
        const program = ts.createProgram([canary], options)
        const diags = fileDiagnostics(program, program.getSourceFile(canary))
        expect(diags.map(d => d.code)).toContain(2339)
        fs.rmSync(canary)
      }

      const baseline = diagnose('baseline')
      const shadow = diagnose('shadow')

      const diagKey = d =>
        `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
      const regressions = []
      for (const {file} of transformed) {
        const known = new Set(baseline.get(file).map(diagKey))
        for (const d of shadow.get(file)) {
          if (!known.has(diagKey(d))) regressions.push(d)
        }
      }
      if (regressions.length > 0) {
        throw new Error(
          `plugin introduced diagnostics in @bsky/sdk dist:\n${formatDiagnostics(regressions)}`,
        )
      }
    },
    TYPECHECK_TIMEOUT_MS,
  )
})

describe('app callsites: transformed sources typecheck', () => {
  /*
   * The real-usage complement to the probe: transform every app file that
   * imports the barrel - with babel-plugin-module-resolver ahead of the
   * plugin, as in babel.config.js, so the '#/lexicons' -> relative-path
   * interop and ordering are exercised - and typecheck the transformed files
   * in place of the originals.
   *
   * Types are kept (no preset-typescript) so tsc has something to check.
   * One behavioral difference follows: in the real pipeline type-only
   * references are stripped before the plugin's Program exit, so removing a
   * fully-rewritten specifier is always safe there. Here type positions
   * survive, and Babel's scope does not count them as references - so when
   * the plugin drops a specifier the type positions still need it. Those
   * names are re-added as a type-only barrel import, which is exactly their
   * production status: erased at runtime, checked against the barrel.
   *
   * checked-vs-baseline: diagnostics of each transformed file are compared
   * against the same file run through the identical parse/print pipeline
   * WITHOUT the leaf plugin. Reprinting artifacts (e.g. a reflowed
   * ts-expect-error directive missing its line) then affect both sides
   * equally and diff out - only differences the plugin caused can fail.
   */
  test(
    'every file importing the barrel',
    async () => {
      const consumers = []
      ;(function walk(dir) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            walk(full)
          } else if (
            /\.tsx?$/.test(entry.name) &&
            !entry.name.endsWith('.d.ts') &&
            fs.readFileSync(full, 'utf8').includes(`from '#/lexicons'`)
          ) {
            consumers.push(full)
          }
        }
      })(path.join(ROOT, 'src'))
      expect(consumers.length).toBeGreaterThan(100)

      /** Names bound by value imports of the barrel, keyed off any path form. */
      function barrelImportNames(code, file) {
        const names = new Set()
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
        })
        for (const stmt of ast.program.body) {
          if (stmt.type !== 'ImportDeclaration') continue
          const source = stmt.source.value
          const abs = source.startsWith('.')
            ? path
                .resolve(path.dirname(file), source)
                .replace(/[\\/]index$/, '')
            : null
          if (source !== '#/lexicons' && abs !== LEXICONS_ROOT) continue
          for (const spec of stmt.specifiers) {
            if (spec.type === 'ImportSpecifier') names.add(spec.local.name)
          }
        }
        return names
      }

      function transformConsumer(code, file, withPlugin) {
        let out = transformSync(code, {
          filename: file,
          cwd: ROOT,
          configFile: false,
          babelrc: false,
          parserOpts: {plugins: ['typescript', 'jsx']},
          plugins: [
            [
              require.resolve('babel-plugin-module-resolver'),
              {alias: {'#': './src', crypto: './src/platform/crypto.ts'}},
            ],
            ...(withPlugin ? [[plugin, {roots: [LEXICONS_ROOT]}]] : []),
          ],
        }).code
        const dropped = [...barrelImportNames(code, file)].filter(
          n => !barrelImportNames(out, file).has(n),
        )
        if (dropped.length > 0) {
          out = `import type {${dropped.join(', ')}} from '#/lexicons'\n` + out
        }
        return out
      }

      const shadowOverlays = new Map()
      const baselineOverlays = new Map()
      let rewritten = 0
      for (const file of consumers) {
        const code = fs.readFileSync(file, 'utf8')
        const out = transformConsumer(code, file, true)
        shadowOverlays.set(file, out)
        baselineOverlays.set(file, transformConsumer(code, file, false))
        if (out.includes('_lex_')) rewritten++
      }
      expect(rewritten).toBeGreaterThan(100)

      const options = loadAppCompilerOptions()

      /*
       * The baseline and shadow typechecks are independent CPU-bound
       * programs, so each runs in its own worker thread and the two proceed
       * in parallel. The worker returns diagnostics as plain records (see
       * lexiconTypecheckWorker.js).
       */
      function diagnose(overlays) {
        return new Promise((resolve, reject) => {
          const worker = new Worker(
            path.join(__dirname, '..', 'lexiconTypecheckWorker.js'),
            {workerData: {consumers, overlays, options}},
          )
          worker.once('message', byFile =>
            resolve(new Map(Object.entries(byFile))),
          )
          worker.once('error', reject)
          worker.once('exit', code => {
            if (code !== 0) {
              reject(new Error(`typecheck worker exited with code ${code}`))
            }
          })
        })
      }

      const [baseline, shadow] = await Promise.all([
        diagnose(baselineOverlays),
        diagnose(shadowOverlays),
      ])

      const diagKey = d => `TS${d.code}: ${d.message}`
      const regressions = []
      for (const file of consumers) {
        const known = new Set(baseline.get(file).map(diagKey))
        for (const d of shadow.get(file)) {
          if (!known.has(diagKey(d))) regressions.push(d)
        }
      }
      if (regressions.length > 0) {
        const details = regressions
          .slice(0, 20)
          .map(d =>
            d.fileName
              ? `${d.fileName}:${d.line} TS${d.code}: ${d.message}`
              : `TS${d.code}: ${d.message}`,
          )
          .join('\n')
        throw new Error(
          `plugin introduced diagnostics in app sources:\n${details}`,
        )
      }
    },
    TYPECHECK_TIMEOUT_MS,
  )
})
