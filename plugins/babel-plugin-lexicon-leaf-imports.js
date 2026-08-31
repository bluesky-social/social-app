/*
 * Lexicon-only "tree shaking".
 *
 * The @atproto/lex codegen exposes every lexicon through nested namespace
 * barrels (`export * as app from './app'` -> `export * as bsky ...` -> leaf),
 * and consumers write `app.bsky.feed.like.$build(...)`. Bundlers see a single
 * used binding (`app`) whose value is an opaque namespace object, so every leaf
 * stays in the bundle. This plugin rewrites static member chains that start at
 * a barrel import into a direct namespace import of the leaf module:
 *
 *   import {app} from '#/lexicons'
 *   app.bsky.feed.like.$build(x)
 *
 * becomes
 *
 *   import * as _lex_app_bsky_feed_like from '../lexicons/app/bsky/feed/like'
 *   _lex_app_bsky_feed_like.$build(x)
 *
 * Once nothing imports the barrels, Metro's reachability drops them and every
 * unreferenced leaf. The same rewrite is applied to @bsky/sdk's compiled output,
 * which imports its own copy of the barrel via '../lexicons/index.js'.
 *
 * Correctness fallback: if any reference to a barrel binding cannot be rewritten
 * (namespace used as a value, computed access, chain ending at a non-leaf,
 * chain in a write position), that binding is left on the barrel import. The result is always correct, merely
 * unshaken for that file. Set BSKY_LEXICON_IMPORTS_DEBUG=1 to log such bails.
 *
 * Caveat: the rewrite bakes leaf file paths into each consumer's transform
 * output, but Metro's and babel-jest's persistent caches key only on the
 * consumer's own content, so a regen that MOVES leaf files (or a @bsky/sdk
 * upgrade that reshuffles dist) can leave unchanged consumers replaying stale
 * leaf imports from a warm cache. Symptoms are a module-not-found error in a
 * file you did not touch or, if the old path still resolves, a runtime
 * undefined-member error. Restart with `expo start -c` (or clear the Jest
 * cache) after such a regen.
 *
 * Leaf vs barrel is decided from the filesystem: a segment with both `<seg>.ts`
 * (or `.js`) and a `<seg>/` directory is a barrel, a segment with only the file
 * is a leaf. This keeps the plugin independent of nesting depth (most NSIDs are
 * four segments, but e.g. com.germnetwork.declaration is three).
 *
 * The filesystem walk assumes barrel re-export names mirror file names 1:1,
 * which holds for codegen output but is not enforced by anything. So before
 * rewriting, each chain is verified against the actual barrel sources: starting
 * at the barrel's index file, follow the `export * as <segment> from '...'`
 * statement for every segment and require that walk to land on the same leaf
 * file the filesystem walk picked. `export * as X` yields the same module
 * namespace object as importing the target directly, so file identity is
 * sufficient proof that the rewrite preserves semantics. Any divergence
 * (renamed re-export, unexpected barrel shape) is a hard build error: a
 * rewrite that points at the wrong module must never ship silently.
 */
const fs = require('node:fs')
const path = require('node:path')

const {
  EXTS,
  SDK_BARREL_RE,
  resolveModuleFile,
  barrelExports,
  clearBarrelExportCache,
} = require('./lexiconBarrels')

const statCache = new Map()

/** @returns {'dir' | 'file' | null} */
function classify(dir, segment) {
  const key = path.join(dir, segment)
  let kind = statCache.get(key)
  if (kind !== undefined) return kind
  kind = null
  try {
    if (fs.statSync(key).isDirectory()) kind = 'dir'
  } catch {}
  if (kind === null) {
    for (const ext of EXTS) {
      if (fs.existsSync(key + ext)) {
        kind = 'file'
        break
      }
    }
  } else {
    // A directory plus a sibling file of the same name is a barrel. A bare
    // directory with no sibling file is not something codegen produces.
    if (!EXTS.some(ext => fs.existsSync(key + ext))) kind = null
  }
  statCache.set(key, kind)
  return kind
}

function leafFileFor(dir, segment) {
  const key = path.join(dir, segment)
  for (const ext of EXTS) {
    if (fs.existsSync(key + ext)) return key + ext
  }
  return null
}

/**
 * True when the member chain is written to rather than read. Such a chain
 * cannot be collapsed into a bare identifier: imports are read-only bindings
 * (assignment/++ would throw where the original property write may not) and
 * `delete <identifier>` is a strict-mode SyntaxError in the emitted code.
 */
function isWriteTarget(memberPath) {
  const parent = memberPath.parentPath
  if (!parent) return false
  if (parent.isAssignmentExpression()) {
    return parent.node.left === memberPath.node
  }
  if (parent.isUpdateExpression()) return true
  if (parent.isUnaryExpression({operator: 'delete'})) return true
  if (parent.isForXStatement()) return parent.node.left === memberPath.node
  if (parent.isArrayPattern() || parent.isRestElement()) return true
  if (parent.isObjectProperty() && parent.parentPath.isObjectPattern()) {
    return parent.node.value === memberPath.node
  }
  return false
}

/** `rootDir\0segments\0leafFile` -> boolean */
const chainCache = new Map()

/**
 * Prove a planned rewrite correct by following the real export graph: parse
 * each barrel on the way down and require the `export * as` chain to resolve
 * to the exact leaf file the filesystem walk picked. Returns false on any
 * divergence; the caller turns that into a hard build error.
 */
function verifyChain(rootDir, segments, leafFile) {
  /*
   * leafFile is part of the key: the cached boolean encodes `walk === leafFile`,
   * so a hit for the same chain but a different planned leaf must not be reused.
   */
  const key = rootDir + '\0' + segments.join('.') + '\0' + leafFile
  let ok = chainCache.get(key)
  if (ok !== undefined) return ok
  let cur = leafFileFor(rootDir, 'index')
  ok = cur !== null
  if (ok) {
    for (const segment of segments) {
      const spec = barrelExports(cur)?.get(segment)
      cur = spec ? resolveModuleFile(cur, spec) : null
      if (!cur) {
        ok = false
        break
      }
    }
  }
  if (ok) ok = cur === leafFile
  chainCache.set(key, ok)
  return ok
}

/** Barrel root dir -> mtimeMs of its index file when the caches were filled. */
const rootEpochs = new Map()

/*
 * The caches above are module-level and would otherwise outlive a lexicon
 * regen inside a long-lived Metro or Jest watch worker, serving stale stats,
 * export maps, and verified chains until the process restarts. Codegen
 * (`lex build --clear`) rewrites the whole tree including the root index, so
 * the index mtime works as an epoch: when it moves, drop all three caches.
 * Costs one statSync per file that actually imports a barrel.
 */
function invalidateStaleCaches(rootDir) {
  let mtime = -1
  for (const ext of EXTS) {
    try {
      mtime = fs.statSync(path.join(rootDir, 'index' + ext)).mtimeMs
      break
    } catch {}
  }
  const prev = rootEpochs.get(rootDir)
  if (prev !== undefined && prev !== mtime) {
    statCache.clear()
    clearBarrelExportCache()
    chainCache.clear()
  }
  rootEpochs.set(rootDir, mtime)
}

const SDK_SEGMENT = `${path.sep}@bsky${path.sep}sdk${path.sep}`

module.exports = function lexiconLeafImports(babel, options = {}) {
  const {types: t} = babel
  /**
   * Absolute paths of barrel directories (e.g. <root>/src/lexicons). Matched
   * against the import specifier after resolving it relative to the importing
   * file, because babel-plugin-module-resolver has already turned '#/lexicons'
   * into a relative path by the time this plugin runs. Relative entries are
   * resolved against Babel's root, not process.cwd(): cwd depends on how the
   * host process (Metro worker, Jest, an IDE runner) was launched, and a wrong
   * base would silently disable every rewrite.
   */
  let roots = null
  function resolveRoots(state) {
    if (!roots) {
      const base = state.file.opts.root ?? state.cwd
      roots = new Set((options.roots ?? []).map(r => path.resolve(base, r)))
    }
  }
  const debug = !!process.env.BSKY_LEXICON_IMPORTS_DEBUG
  const stats = {files: 0, rewrites: 0, bails: 0}

  function barrelDirFor(source, filename) {
    if (source.startsWith('.')) {
      const abs = path
        .resolve(path.dirname(filename), source)
        .replace(/[\\/]index(\.[jt]s)?$/, '')
      if (roots.has(abs)) return abs
      if (SDK_BARREL_RE.test(source) && filename.includes(SDK_SEGMENT)) {
        return abs
      }
    }
    return null
  }

  /**
   * Walk the member chain hanging off a reference to a barrel binding down to
   * the leaf module. Returns the MemberExpression path whose value is the leaf
   * namespace plus the leaf's absolute file path, or null if the chain cannot
   * be rewritten safely.
   */
  function planRewrite(refPath, rootDir, rootSegment) {
    let dir = rootDir
    let segment = rootSegment
    let cur = refPath
    const segments = [rootSegment]
    for (;;) {
      const kind = classify(dir, segment)
      if (kind === 'file') {
        if (isWriteTarget(cur)) return null
        return {memberPath: cur, leafFile: leafFileFor(dir, segment), segments}
      }
      if (kind !== 'dir') return null
      const parent = cur.parentPath
      if (
        !parent ||
        !parent.isMemberExpression() ||
        parent.node.object !== cur.node ||
        parent.node.computed ||
        !t.isIdentifier(parent.node.property)
      ) {
        return null
      }
      dir = path.join(dir, segment)
      segment = parent.node.property.name
      segments.push(segment)
      cur = parent
    }
  }

  function toSpecifier(fromFile, leafFile) {
    let rel = path
      .relative(path.dirname(fromFile), leafFile)
      .split(path.sep)
      .join('/')
    // Keep `.js` for the SDK's ESM output; strip `.ts` so Metro resolves
    // platform extensions for app sources normally.
    rel = rel.replace(/\.ts$/, '')
    if (!rel.startsWith('.')) rel = './' + rel
    return rel
  }

  return {
    name: 'lexicon-leaf-imports',
    visitor: {
      Program: {
        exit(programPath, state) {
          const filename = state.filename
          if (!filename) return
          resolveRoots(state)
          const targets = []
          for (const stmt of programPath.get('body')) {
            if (!stmt.isImportDeclaration()) continue
            if (stmt.node.importKind === 'type') continue
            /*
            * A specifier-less import exists only for module evaluation; there is
            * nothing to rewrite, so leave it untouched.
            */
            if (stmt.node.specifiers.length === 0) continue

            const dir = barrelDirFor(stmt.node.source.value, filename)
            if (dir) targets.push({imp: stmt, dir})
          }
          if (targets.length === 0) return
          for (const {dir} of targets) {
            invalidateStaleCaches(dir)
          }

          /*
           * Type-only references were stripped by the TypeScript transform
           * earlier in this traversal; re-crawl so referencePaths reflect the
           * current tree.
           */
          programPath.scope.crawl()
          const leafImports = new Map()
          let pendingDecls = []
          let touched = false

          function namespaceIdFor(leafFile) {
            let id = leafImports.get(leafFile)
            if (id) return id
            const hint =
              'lex_' +
              leafFile
                .replace(/\.(ts|js)$/, '')
                .split(path.sep)
                .slice(-4)
                .join('_')
                .replace(/[^A-Za-z0-9_]/g, '_')
            id = programPath.scope.generateUidIdentifier(hint)
            leafImports.set(leafFile, id)
            pendingDecls.push(
              t.importDeclaration(
                [t.importNamespaceSpecifier(t.cloneNode(id))],
                t.stringLiteral(toSpecifier(filename, leafFile)),
              ),
            )
            return id
          }

          for (const {imp, dir} of targets) {
            pendingDecls = []
            const keep = []
            for (const spec of imp.get('specifiers')) {
              if (
                !spec.isImportSpecifier() ||
                spec.node.importKind === 'type'
              ) {
                keep.push(spec.node)
                continue
              }
              const imported = spec.node.imported
              const rootSegment = t.isIdentifier(imported)
                ? imported.name
                : imported.value
              const binding = programPath.scope.getBinding(spec.node.local.name)
              if (!binding || binding.path !== spec) {
                keep.push(spec.node)
                continue
              }
              const plan = []
              let ok = true
              for (const ref of binding.referencePaths) {
                const r = planRewrite(ref, dir, rootSegment)
                if (r && !verifyChain(dir, r.segments, r.leafFile)) {
                  throw ref.buildCodeFrameError(
                    `[lexicon-leaf-imports] filesystem walk resolved '${r.segments.join('.')}' to ${path.relative(process.cwd(), r.leafFile)}, but following the barrel's own 'export * as' chain does not reach that file. The barrel layout no longer matches the plugin's assumptions; fix the barrels or the plugin.`,
                  )
                }
                if (!r) {
                  ok = false
                  if (debug) {
                    const loc = ref.node.loc?.start
                    console.warn(
                      `[lexicon-leaf-imports] bail: ${path.relative(process.cwd(), filename)}:${loc?.line}:${loc?.column} (${rootSegment})`,
                    )
                  }
                  break
                }
                plan.push(r)
              }
              if (!ok) {
                stats.bails++
                keep.push(spec.node)
                continue
              }
              for (const {memberPath, leafFile} of plan) {
                memberPath.replaceWith(t.cloneNode(namespaceIdFor(leafFile)))
                stats.rewrites++
              }
              touched = true
            }
            /*
             * Insert the leaf imports at the barrel import's own position so
             * they evaluate exactly when the barrel would have - hoisting them
             * to the top of the file would run the lexicon modules ahead of
             * ordering-sensitive side-effect imports (polyfills, sentry setup).
             */
            if (pendingDecls.length > 0) {
              imp.insertBefore(pendingDecls)
            }
            if (keep.length === 0) {
              imp.remove()
            } else if (keep.length !== imp.node.specifiers.length) {
              imp.node.specifiers = keep
            }
          }

          if (touched) stats.files++
          if (debug && touched) {
            console.warn(
              `[lexicon-leaf-imports] ${path.relative(process.cwd(), filename)}: ${leafImports.size} leaf imports (total files=${stats.files} rewrites=${stats.rewrites} bails=${stats.bails})`,
            )
          }
        },
      },
    },
  }
}
