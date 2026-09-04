/*
 * Shared mechanics for reading the generated lexicon barrels, used by
 * babel-plugin-lexicon-leaf-imports and its test suites. The tests keep their
 * own walking logic (an export-graph oracle vs the plugin's filesystem
 * heuristic); only this mechanical layer - how a specifier resolves to a file
 * and how a barrel parses into its re-export map - is shared, so the copies
 * cannot drift apart.
 */
const fs = require('node:fs')
const parser = require('@babel/parser')
const path = require('node:path')

/** Extensions codegen emits: `.ts` for app sources, `.js` for the SDK dist. */
const EXTS = ['.ts', '.js']
const EXT_RE = new RegExp(`\\.(${EXTS.map(e => e.slice(1)).join('|')})$`)

/** Matches the SDK's compiled barrel entry, e.g. '../lexicons/index.js'. */
const SDK_BARREL_RE = /(^|\/)lexicons\/index\.js$/

/**
 * Resolve a barrel/leaf specifier relative to the importing file: the exact
 * path when it already carries a known extension, otherwise the first of
 * EXTS that exists.
 *
 * @param {string} fromFile
 * @param {string} spec
 * @returns {string | null} absolute file path, or null
 */
function resolveModuleFile(fromFile, spec) {
  const abs = path.resolve(path.dirname(fromFile), spec)
  if (EXT_RE.test(abs) && fs.existsSync(abs)) return abs
  for (const ext of EXTS) {
    if (fs.existsSync(abs + ext)) return abs + ext
  }
  return null
}

/** Absolute barrel file -> Map(exported name -> source specifier), or null. */
const barrelExportCache = new Map()

/**
 * Parse a barrel file into its namespace re-export map. Returns null if the
 * file contains anything other than `export * as X from '...'` statements
 * (plus type-only exports) - chains through such a file cannot be proven, so
 * lookups fail and the caller bails.
 *
 * @param {string} file
 * @returns {Map<string, string> | null}
 */
function barrelExports(file) {
  let map = barrelExportCache.get(file)
  if (map !== undefined) return map
  map = new Map()
  try {
    const ast = parser.parse(fs.readFileSync(file, 'utf8'), {
      sourceType: 'module',
      plugins: ['typescript'],
    })
    for (const stmt of ast.program.body) {
      if (stmt.exportKind === 'type') continue
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
        const name =
          s.exported.type === 'Identifier' ? s.exported.name : s.exported.value
        map.set(name, stmt.source.value)
      }
    }
  } catch {
    map = null
  }
  barrelExportCache.set(file, map)
  return map
}

function clearBarrelExportCache() {
  barrelExportCache.clear()
}

module.exports = {
  EXTS,
  SDK_BARREL_RE,
  resolveModuleFile,
  barrelExports,
  clearBarrelExportCache,
}
