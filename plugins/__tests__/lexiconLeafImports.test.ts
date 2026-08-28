/*
 * Differential resolution test for babel-plugin-lexicon-leaf-imports.
 *
 * For every project file that imports the lexicon barrel, this test computes
 * where each member chain (`app.bsky.feed.like`) SHOULD lead by walking the
 * barrels' actual `export * as` statements (an oracle independent of the
 * plugin's filesystem heuristic), then runs the real transform and resolves
 * the leaf imports it emitted. The two resolutions must agree - compared by
 * file content hash, so the assertion is "the import binds to the same code"
 * rather than a path-string comparison.
 *
 * Chains the oracle cannot follow statically (computed access, namespace used
 * as a value) must bail in the plugin too: the barrel import has to survive in
 * the output exactly when the oracle predicts a bail.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import * as babel from '@babel/core'
import {parse} from '@babel/parser'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const traverse = require('@babel/traverse').default

const ROOT = path.resolve(__dirname, '../..')
const PLUGIN = path.join(ROOT, 'plugins/babel-plugin-lexicon-leaf-imports.js')
const APP_BARREL_ENTRY = path.join(ROOT, 'src/lexicons/index.ts')
const SDK_DIST = path.join(ROOT, 'node_modules/@bsky/sdk/dist')
const SDK_BARREL_RE = /(^|\/)lexicons\/index\.js$/

function listFiles(dir: string, exts: string[]): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(full, exts))
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      out.push(full)
    }
  }
  return out
}

function resolveSpec(fromFile: string, spec: string): string | null {
  const abs = path.resolve(path.dirname(fromFile), spec)
  if (/\.(ts|tsx|js)$/.test(abs) && fs.existsSync(abs)) return abs
  for (const ext of ['.ts', '.tsx', '.js']) {
    if (fs.existsSync(abs + ext)) return abs + ext
  }
  return null
}

const hashCache = new Map<string, string>()
function contentHash(file: string): string {
  let h = hashCache.get(file)
  if (!h) {
    h = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
    hashCache.set(file, h)
  }
  return h
}

/**
 * The oracle's own barrel parser (written independently of the plugin's):
 * Map of exported name -> source specifier for a file consisting purely of
 * `export * as X from '...'` statements, or null for any other file shape -
 * which is exactly what distinguishes a leaf from a barrel.
 */
const barrelCache = new Map<string, Map<string, string> | null>()
function barrelExports(file: string): Map<string, string> | null {
  let map = barrelCache.get(file)
  if (map !== undefined) return map
  map = new Map()
  try {
    const ast = parse(fs.readFileSync(file, 'utf8'), {
      sourceType: 'module',
      plugins: ['typescript'],
    })
    for (const stmt of ast.program.body) {
      if (stmt.type === 'ExportNamedDeclaration' && stmt.exportKind === 'type')
        continue
      if (
        stmt.type !== 'ExportNamedDeclaration' ||
        !stmt.source ||
        stmt.declaration ||
        stmt.specifiers.length === 0 ||
        !stmt.specifiers.every(s => s.type === 'ExportNamespaceSpecifier')
      ) {
        map = null
        break
      }
      for (const s of stmt.specifiers) {
        if (s.type === 'ExportNamespaceSpecifier') {
          map.set(s.exported.name, stmt.source.value)
        }
      }
    }
  } catch {
    map = null
  }
  barrelCache.set(file, map)
  return map
}

type ChainResult =
  {leaf: string; chain: string[]} | {bail: true} | {error: string}

/**
 * Follow one member chain through the barrels' export statements: at each
 * step look the segment up in the current barrel's `export * as` map and
 * resolve its source. A resolved file that is not itself a pure-namespace
 * barrel is the leaf. Needing another segment when the expression has none
 * left (or has a non-static one) is a bail, mirroring the plugin's contract.
 */
function walkChain(
  ref: any,
  entryBarrel: string,
  rootSegment: string,
): ChainResult {
  let curFile = entryBarrel
  let segment = rootSegment
  let cur = ref
  const chain = [rootSegment]
  for (;;) {
    const exports = barrelExports(curFile)
    if (!exports) return {error: `${curFile} is not a pure namespace barrel`}
    const spec = exports.get(segment)
    if (!spec) return {error: `'${chain.join('.')}' not exported by ${curFile}`}
    const next = resolveSpec(curFile, spec)
    if (!next) return {error: `cannot resolve '${spec}' from ${curFile}`}
    if (barrelExports(next) === null) return {leaf: next, chain}
    const parent = cur.parentPath
    if (
      !parent?.isMemberExpression() ||
      parent.node.object !== cur.node ||
      parent.node.computed ||
      parent.node.property.type !== 'Identifier'
    ) {
      return {bail: true}
    }
    curFile = next
    segment = parent.node.property.name
    chain.push(segment)
    cur = parent
  }
}

/**
 * References in type positions are stripped before the plugin runs, so the
 * oracle must ignore them too. In type positions chains appear as
 * TSQualifiedName (or a bare TSTypeQuery for `typeof app`), never as
 * MemberExpression.
 */
function isTypeReference(ref: any): boolean {
  return ref.parentPath?.isTSQualifiedName() || ref.parentPath?.isTSTypeQuery()
}

type Expectation = {
  /** chain joined with '.' -> absolute leaf file */
  leaves: Map<string, string>
  /** true when the plugin must keep (part of) the barrel import */
  barrelRetained: boolean
  errors: string[]
}

function computeExpectation(file: string, code: string): Expectation {
  const isSdk = file.startsWith(SDK_DIST)
  const leaves = new Map<string, string>()
  const errors: string[] = []
  let barrelRetained = false

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })
  traverse(ast, {
    Program(programPath: any) {
      for (const stmt of programPath.get('body')) {
        if (!stmt.isImportDeclaration()) continue
        if (stmt.node.importKind === 'type') continue
        const source = stmt.node.source.value
        let entryBarrel: string | null = null
        if (!isSdk && source === '#/lexicons') {
          entryBarrel = APP_BARREL_ENTRY
        } else if (isSdk && SDK_BARREL_RE.test(source)) {
          entryBarrel = resolveSpec(file, source)
        }
        if (!entryBarrel) continue

        for (const spec of stmt.get('specifiers')) {
          /*
           * Type-only specifiers are stripped from the output together with
           * their references, so they neither rewrite nor retain the barrel.
           * Non-named value specifiers (namespace/default) are kept by the
           * plugin and do retain it.
           */
          if (spec.node.importKind === 'type') continue
          if (!spec.isImportSpecifier()) {
            barrelRetained = true
            continue
          }
          const imported = spec.node.imported
          const rootSegment =
            imported.type === 'Identifier' ? imported.name : imported.value
          const binding = programPath.scope.getBinding(spec.node.local.name)
          if (!binding) continue
          const chains: Array<{leaf: string; chain: string[]}> = []
          let bailed = false
          for (const ref of binding.referencePaths) {
            if (isTypeReference(ref)) continue
            const r = walkChain(ref, entryBarrel, rootSegment)
            if ('error' in r) {
              errors.push(r.error)
              bailed = true
              break
            }
            if ('bail' in r) {
              bailed = true
              break
            }
            chains.push(r)
          }
          if (bailed) {
            barrelRetained = true
          } else {
            for (const {leaf, chain} of chains) {
              leaves.set(chain.join('.'), leaf)
            }
          }
        }
      }
      programPath.stop()
    },
  })
  return {leaves, barrelRetained, errors}
}

/**
 * The real transform, reduced to the plugins that participate in import
 * rewriting. react-compiler, lingui, and worklets are omitted for speed; they
 * do not touch import declarations, and their interaction with this plugin is
 * covered by the full Jest suite running the complete config.
 */
function transformActual(file: string, code: string): string {
  const result = babel.transformSync(code, {
    filename: file,
    cwd: ROOT,
    configFile: false,
    babelrc: false,
    presets: [
      [
        require.resolve('@babel/preset-typescript'),
        {isTSX: /\.tsx$/.test(file), allExtensions: true},
      ],
    ],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {alias: {'#': './src'}},
      ],
      [PLUGIN, {roots: [path.join(ROOT, 'src/lexicons')]}],
    ],
  })
  return result!.code!
}

type Actual = {
  /** absolute resolved leaf files from emitted `_lex_*` namespace imports */
  leaves: Map<string, string>
  barrelRetained: boolean
}

function collectActual(file: string, output: string): Actual {
  const isSdk = file.startsWith(SDK_DIST)
  const leaves = new Map<string, string>()
  let barrelRetained = false
  const ast = parse(output, {sourceType: 'module', plugins: ['jsx']})
  for (const stmt of ast.program.body) {
    if (stmt.type !== 'ImportDeclaration') continue
    const source = stmt.source.value
    const ns = stmt.specifiers.find(
      s => s.type === 'ImportNamespaceSpecifier' && /^_lex_/.test(s.local.name),
    )
    if (ns) {
      const resolved = resolveSpec(file, source)
      leaves.set(source, resolved ?? `<unresolvable: ${source}>`)
      continue
    }
    const resolved = source.startsWith('.') ? resolveSpec(file, source) : null
    if (
      resolved === APP_BARREL_ENTRY ||
      (isSdk && SDK_BARREL_RE.test(source) && resolved)
    ) {
      barrelRetained = true
    }
  }
  return {leaves, barrelRetained}
}

function checkFile(file: string): string[] {
  const failures: string[] = []
  const rel = path.relative(ROOT, file)
  const code = fs.readFileSync(file, 'utf8')

  const expected = computeExpectation(file, code)
  for (const err of expected.errors) {
    failures.push(`${rel}: oracle error: ${err}`)
  }

  let output: string
  try {
    output = transformActual(file, code)
  } catch (e) {
    failures.push(`${rel}: transform threw: ${(e as Error).message}`)
    return failures
  }
  const actual = collectActual(file, output)

  const actualByHash = new Map<string, string>()
  for (const [source, resolved] of actual.leaves) {
    if (resolved.startsWith('<')) {
      failures.push(`${rel}: emitted import does not resolve: '${source}'`)
    } else {
      actualByHash.set(contentHash(resolved), resolved)
    }
  }

  const expectedHashes = new Set<string>()
  for (const [chain, leaf] of expected.leaves) {
    const hash = contentHash(leaf)
    expectedHashes.add(hash)
    if (!actualByHash.has(hash)) {
      failures.push(
        `${rel}: chain '${chain}' should bind to ${path.relative(ROOT, leaf)} ` +
          `but no emitted import matches its content`,
      )
    }
  }
  for (const [hash, resolved] of actualByHash) {
    if (!expectedHashes.has(hash)) {
      failures.push(
        `${rel}: emitted import of ${path.relative(ROOT, resolved)} ` +
          `matches no barrel chain in the source`,
      )
    }
  }

  if (actual.barrelRetained !== expected.barrelRetained) {
    failures.push(
      `${rel}: barrel import ${actual.barrelRetained ? 'survived' : 'removed'} ` +
        `but oracle expected ${expected.barrelRetained ? 'a bail' : 'full rewrite'}`,
    )
  }
  return failures
}

describe('lexicon leaf import rewrites resolve to the same modules as the barrels', () => {
  test('app sources', () => {
    const consumers = listFiles(path.join(ROOT, 'src'), ['.ts', '.tsx']).filter(
      f => fs.readFileSync(f, 'utf8').includes(`from '#/lexicons'`),
    )
    expect(consumers.length).toBeGreaterThan(100)
    const failures = consumers.flatMap(checkFile)
    expect(failures).toEqual([])
  }, 240_000)

  test('@bsky/sdk compiled output', () => {
    const consumers = listFiles(SDK_DIST, ['.js']).filter(f =>
      fs.readFileSync(f, 'utf8').includes(`lexicons/index.js'`),
    )
    expect(consumers.length).toBeGreaterThan(0)
    const failures = consumers.flatMap(checkFile)
    expect(failures).toEqual([])
  }, 120_000)
})
