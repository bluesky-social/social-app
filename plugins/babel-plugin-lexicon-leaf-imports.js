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
 * (namespace used as a value, computed access, chain ending at a non-leaf), that
 * binding is left on the barrel import. The result is always correct, merely
 * unshaken for that file. Set BSKY_LEXICON_IMPORTS_DEBUG=1 to log such bails.
 *
 * Leaf vs barrel is decided from the filesystem: a segment with both `<seg>.ts`
 * (or `.js`) and a `<seg>/` directory is a barrel, a segment with only the file
 * is a leaf. This keeps the plugin independent of nesting depth (most NSIDs are
 * four segments, but e.g. com.germnetwork.declaration is three).
 */
const fs = require('node:fs')
const path = require('node:path')

const EXTS = ['.ts', '.js']
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

const SDK_SEGMENT = `${path.sep}@bsky${path.sep}sdk${path.sep}`
const SDK_BARREL_RE = /(^|\/)lexicons\/index\.js$/

module.exports = function lexiconLeafImports(babel, options = {}) {
  const {types: t} = babel
  /**
   * Absolute paths of barrel directories (e.g. <root>/src/lexicons). Matched
   * against the import specifier after resolving it relative to the importing
   * file, because babel-plugin-module-resolver has already turned '#/lexicons'
   * into a relative path by the time this plugin runs.
   */
  const roots = new Set((options.roots ?? []).map(r => path.resolve(r)))
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
    for (;;) {
      const kind = classify(dir, segment)
      if (kind === 'file') {
        return {memberPath: cur, leafFile: leafFileFor(dir, segment)}
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
          const targets = []
          for (const stmt of programPath.get('body')) {
            if (!stmt.isImportDeclaration()) continue
            if (stmt.node.importKind === 'type') continue
            const dir = barrelDirFor(stmt.node.source.value, filename)
            if (dir) targets.push({imp: stmt, dir})
          }
          if (targets.length === 0) return

          /*
           * Type-only references were stripped by the TypeScript transform
           * earlier in this traversal; re-crawl so referencePaths reflect the
           * current tree.
           */
          programPath.scope.crawl()
          const leafImports = new Map()
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
            return id
          }

          for (const {imp, dir} of targets) {
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
            if (keep.length === 0) {
              imp.remove()
            } else if (keep.length !== imp.node.specifiers.length) {
              imp.node.specifiers = keep
            }
          }

          if (leafImports.size > 0) {
            const decls = []
            for (const [leafFile, id] of leafImports) {
              decls.push(
                t.importDeclaration(
                  [t.importNamespaceSpecifier(t.cloneNode(id))],
                  t.stringLiteral(toSpecifier(filename, leafFile)),
                ),
              )
            }
            programPath.unshiftContainer('body', decls)
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
