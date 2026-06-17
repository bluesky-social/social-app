// @ts-check
/**
 * Regenerate the hardcoded brand colours in the web pre-boot files
 * (web/index.html, bskyweb/templates/base.html) from the single source
 * src/config/brand-colors.json, so they never drift from the in-app ALF theme.
 *
 * These files render before any JS / per-user accent preference loads (and
 * base.html is served by the Go server, not the Expo web build), so they use
 * the org's shipped default accent.
 *
 *   node scripts/sync-brand-web.mjs           write the files
 *   node scripts/sync-brand-web.mjs --check   exit non-zero if out of sync (CI)
 *
 * Edit colours in brand-colors.json, then run `pnpm brand:sync-web`. The
 * colour values between the BRAND-GEN markers are machine-generated; do not
 * hand-edit them.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const COLORS_PATH = path.join(ROOT, 'src/config/brand-colors.json')
const LOGO_PATH = path.join(ROOT, 'src/config/brand-logo.json')

const colors = JSON.parse(fs.readFileSync(COLORS_PATH, 'utf8'))
const logo = JSON.parse(fs.readFileSync(LOGO_PATH, 'utf8'))
const N = colors.neutral
const S = {...colors.neutral, ...colors.neutralSubduedOverrides}
const A = colors.accents[colors.defaultAccent]
if (!A) {
  throw new Error(
    `brand-colors.json: defaultAccent "${colors.defaultAccent}" is not in accents`,
  )
}

const TARGETS = ['web/index.html', 'bskyweb/templates/base.html']

/**
 * The themed CSS custom-property block. Indentation is taken from the start
 * marker so index.html (6 spaces) and base.html (4 spaces) both match exactly.
 * Mapping mirrors how ALF derives the body background from the palette:
 *   light = neutral.contrast_0, dark = neutral.contrast_1000,
 *   dim   = subdued.contrast_1000.
 * @param {string} i
 */
function cssBlock(i) {
  const p = i + '  '
  const q = p + '  '
  return [
    `${i}:root {`,
    `${p}--text: ${N.contrast_950};`,
    `${p}--background: ${N.contrast_0};`,
    `${p}--backgroundLight: ${N.contrast_25};`,
    `${i}}`,
    `${i}@media (prefers-color-scheme: dark) {`,
    `${p}:root {`,
    `${q}color-scheme: dark;`,
    `${q}--text: ${N.contrast_25};`,
    `${q}--background: ${N.contrast_1000};`,
    `${q}--backgroundLight: ${N.contrast_950};`,
    `${p}}`,
    `${i}}`,
    `${i}html,`,
    `${i}body,`,
    `${i}#root {`,
    `${p}display: flex;`,
    `${p}flex: 1 0 auto;`,
    `${p}min-height: 100%;`,
    `${p}width: 100%;`,
    `${i}}`,
    `${i}html.theme--light,`,
    `${i}html.theme--light body,`,
    `${i}html.theme--light #root {`,
    `${p}background-color: ${N.contrast_0};`,
    `${p}--text: ${N.contrast_950};`,
    `${p}--background: ${N.contrast_0};`,
    `${p}--backgroundLight: ${N.contrast_25};`,
    `${i}}`,
    `${i}html.theme--dark,`,
    `${i}html.theme--dark body,`,
    `${i}html.theme--dark #root {`,
    `${p}color-scheme: dark;`,
    `${p}background-color: ${N.contrast_1000};`,
    `${p}--text: ${N.contrast_25};`,
    `${p}--background: ${N.contrast_1000};`,
    `${p}--backgroundLight: ${N.contrast_950};`,
    `${i}}`,
    `${i}html.theme--dim,`,
    `${i}html.theme--dim body,`,
    `${i}html.theme--dim #root {`,
    `${p}color-scheme: dark;`,
    `${p}background-color: ${S.contrast_1000};`,
    `${p}--text: ${N.contrast_25};`,
    `${p}--background: ${S.contrast_1000};`,
    `${p}--backgroundLight: ${S.contrast_900};`,
    `${i}}`,
  ].join('\n')
}

/** @param {string} i */
function themeColorMeta(i) {
  return `${i}<meta name="theme-color" content="${A.primary_500}">`
}

/**
 * Pre-boot splash glyph, generated from the logo geometry (brand-logo.json) +
 * the default accent. Single line, matching the static #splash mark the React
 * splash (src/Splash*.tsx) hands off to. When the brand ships a dimensional
 * logo it is the 3D wordmark (shadow primary_900 behind face primary_400);
 * otherwise the flat wordmark filled with primary_500.
 * @param {string} i
 */
function splashSvg(i) {
  const d = logo.dimensional
  const paths = d
    ? `<path fill="${A.primary_900}" d="${d.shadowPath}"/>` +
      `<path fill="${A.primary_400}" d="${d.facePath}"/>`
    : `<path fill="${A.primary_500}" d="${logo.flat.path}"/>`
  const viewBox = (d ?? logo.flat).viewBox
  return `${i}<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${paths}</svg>`
}

/**
 * Replace the lines between `<!-- BRAND-GEN:<id> start ... -->` and
 * `<!-- BRAND-GEN:<id> end -->` (or the `/* ... *\/` CSS-comment form) with the
 * output of build(indent), where indent is the leading whitespace of the start
 * marker. Idempotent. Throws if the markers are missing.
 * @param {string} content
 * @param {string} id
 * @param {'css' | 'html'} kind
 * @param {(indent: string) => string} build
 */
function regenRegion(content, id, kind, build) {
  const open = kind === 'css' ? '/\\*' : '<!--'
  const close = kind === 'css' ? '\\*/' : '-->'
  const startRe = new RegExp(
    `([ \\t]*)${open} BRAND-GEN:${id} start[\\s\\S]*?${close}`,
  )
  const endRe = new RegExp(`[ \\t]*${open} BRAND-GEN:${id} end ${close}`)
  const sm = content.match(startRe)
  const em = content.match(endRe)
  if (!sm || !em || sm.index === undefined || em.index === undefined) {
    throw new Error(`BRAND-GEN:${id} markers not found`)
  }
  const indent = sm[1]
  const startEnd = sm.index + sm[0].length
  return content.slice(0, startEnd) + '\n' + build(indent) + '\n' + content.slice(em.index)
}

/** @param {string} content */
function renderFile(content) {
  let out = content
  out = regenRegion(out, 'colors', 'css', cssBlock)
  out = regenRegion(out, 'theme-color', 'html', themeColorMeta)
  // mask-icon colour (base.html only) - preserve the {{ staticCDNHost }} href.
  out = out.replace(
    /(<link rel="mask-icon"[^>]*\scolor=")#[0-9A-Fa-f]{6}(")/,
    `$1${A.primary_500}$2`,
  )
  out = regenRegion(out, 'splash', 'html', splashSvg)
  return out
}

const check = process.argv.includes('--check')
const drift = []

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel)
  const orig = fs.readFileSync(file, 'utf8')
  const next = renderFile(orig)
  if (next === orig) {
    if (!check) console.log(`unchanged  ${rel}`)
    continue
  }
  if (check) {
    drift.push(rel)
  } else {
    fs.writeFileSync(file, next)
    console.log(`updated    ${rel}`)
  }
}

if (check && drift.length) {
  console.error(
    `\nbrand web assets out of sync:\n  ${drift.join('\n  ')}\n\nRun: pnpm brand:sync-web`,
  )
  process.exit(1)
}
if (check) console.log('brand web assets in sync')
