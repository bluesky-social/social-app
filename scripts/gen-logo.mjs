// @ts-check
/**
 * Brand logo codegen.
 *
 * Source of truth for the in-app logo is a set of SVG files under assets/brand/
 * (one per named role; `mark` is required, the rest are optional and fall back
 * to it - see src/config/brand-logo.ts). This reads them and emits the runtime
 * artifact src/config/brand-logo.generated.json, consumed by:
 *   - <BrandLogo> (src/components/icons) via SvgXml,
 *   - the web pre-boot splash codegen (scripts/sync-brand-web.mjs),
 *   - the favicon/safari-mask generator (scripts/gen-brand-favicons.mjs).
 *
 * Logo fills follow a tiny convention so a single SVG can be themed:
 *   - `fill="currentColor"`         -> the primary tint (BrandLogo `fill` prop)
 *   - `fill="theme:<paletteKey>"`   -> substituted from the active ALF palette
 *                                      at render (e.g. theme:primary_900), so a
 *                                      multi-tone logo follows the accent picker.
 * Plain colours (hex/rgb) render as-authored.
 *
 *   node scripts/gen-logo.mjs           write the artifact
 *   node scripts/gen-logo.mjs --check   exit non-zero if stale (CI)
 *
 * Edit the SVGs in assets/brand/, then run `pnpm brand:gen-logo`.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'assets/brand')
const OUT = path.join(ROOT, 'src/config/brand-logo.generated.json')

/** Recognised roles, in no particular order. `mark` is required. */
const ROLES = ['mark', 'wordmark', 'lockup', 'hero', 'icon']

/** @param {string} raw */
function clean(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '') // strip comments
    .replace(/>\s+</g, '><') // drop inter-tag whitespace
    .replace(/\s{2,}/g, ' ') // collapse runs of whitespace
    .trim()
}

/**
 * @param {string} role
 * @param {string} xml
 */
function parseRole(role, xml) {
  const vb = xml.match(/viewBox="([^"]+)"/)
  if (!vb) throw new Error(`assets/brand/${role}.svg: missing viewBox`)
  const nums = vb[1].trim().split(/[\s,]+/).map(Number)
  const [, , w, h] = nums
  if (!w || !h || nums.length !== 4) {
    throw new Error(`assets/brand/${role}.svg: bad viewBox "${vb[1]}"`)
  }
  // Surface obviously-broken theme tokens early.
  for (const m of xml.matchAll(/theme:([A-Za-z0-9_]*)/g)) {
    if (!m[1]) throw new Error(`assets/brand/${role}.svg: empty theme: token`)
  }
  return {viewBox: vb[1].trim(), ratio: h / w, xml}
}

/** @type {Record<string, {viewBox: string, ratio: number, xml: string}>} */
const out = {}
for (const role of ROLES) {
  const file = path.join(SRC_DIR, `${role}.svg`)
  if (!fs.existsSync(file)) continue
  out[role] = parseRole(role, clean(fs.readFileSync(file, 'utf8')))
}
if (!out.mark) {
  throw new Error('assets/brand/mark.svg is required (the base brand logo)')
}

const next = JSON.stringify(out, null, 2) + '\n'
const check = process.argv.includes('--check')
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''

if (next === prev) {
  console.log(`brand logo in sync (${Object.keys(out).join(', ')})`)
} else if (check) {
  console.error('\nbrand-logo.generated.json is stale. Run: pnpm brand:gen-logo')
  process.exit(1)
} else {
  fs.writeFileSync(OUT, next)
  console.log(`wrote ${path.relative(ROOT, OUT)} (${Object.keys(out).join(', ')})`)
}
