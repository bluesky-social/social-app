// @ts-check
/**
 * Regenerate the hardcoded brand colours in the web pre-boot files
 * (web/index.html, bskyweb/templates/base.html) from the single source
 * src/config/brand.json, so they never drift from the in-app ALF theme.
 *
 * These files render before any JS / per-user accent preference loads (and
 * base.html is served by the Go server, not the Expo web build), so they use
 * the org's shipped default accent.
 *
 *   node scripts/sync-brand-web.mjs           write the files
 *   node scripts/sync-brand-web.mjs --check   exit non-zero if out of sync (CI)
 *
 * Edit colours in brand.json, then run `pnpm brand:sync-web`. The
 * colour values between the BRAND-GEN markers are machine-generated; do not
 * hand-edit them.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BRAND_PATH = path.join(ROOT, 'src/config/brand.json')
const LOGO_PATH = path.join(ROOT, 'src/config/brand-logo.generated.json')

const brand = JSON.parse(fs.readFileSync(BRAND_PATH, 'utf8'))
const colors = brand.colors
const logo = JSON.parse(fs.readFileSync(LOGO_PATH, 'utf8'))
const meta = brand
const BRAND_NAME = meta.name
const BRAND_HOST = meta.hosts[0]
const SOCIAL_HANDLE = meta.socialHandle
const OG_IMAGE = `https://${BRAND_HOST}/og-image.jpg`
const N = colors.neutral
const S = {...colors.neutral, ...colors.neutralSubduedOverrides}
const A = colors.accents[colors.defaultAccent]
if (!A) {
  throw new Error(
    `brand.json#colors: defaultAccent "${colors.defaultAccent}" is not in accents`,
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
 * Pre-boot splash mark - the generated brand logo SVG (brand-logo.generated.json,
 * from assets/brand/*.svg) inlined verbatim, matching the static #splash mark the
 * React splash (src/Splash*.tsx) hands off to. Uses the `hero` role when present
 * (mu's dimensional wordmark), else `mark`. Logo `theme:<key>` tokens and
 * `currentColor` are resolved here from the default accent, mirroring how
 * <BrandLogo> resolves them from the active theme in-app.
 * @param {string} i
 */
function splashSvg(i) {
  const role = logo.hero ?? logo.mark
  const xml = role.xml
    .replace(/theme:([A-Za-z0-9_]+)/g, (_, k) => A[k] ?? 'currentColor')
    .replace(/currentColor/g, A.primary_500)
  return `${i}${xml}`
}

/**
 * og:/twitter: share-card block (web/index.html). Name + host come from
 * brand.json; type / image dimensions / card kind stay static. The
 * og-image.jpg file ships at the brand host root.
 * @param {string} i
 */
function metaBlock(i) {
  return [
    `${i}<meta property="og:type" content="website">`,
    `${i}<meta property="og:site_name" content="${BRAND_NAME}">`,
    `${i}<meta property="og:title" content="${BRAND_NAME}">`,
    `${i}<meta property="og:url" content="https://${BRAND_HOST}">`,
    `${i}<meta property="og:image" content="${OG_IMAGE}">`,
    `${i}<meta property="og:image:width" content="2400">`,
    `${i}<meta property="og:image:height" content="1600">`,
    `${i}<meta property="og:image:alt" content="${BRAND_NAME}">`,
    `${i}<meta name="twitter:card" content="summary_large_image">`,
    `${i}<meta name="twitter:title" content="${BRAND_NAME}">`,
    `${i}<meta name="twitter:image" content="${OG_IMAGE}">`,
  ].join('\n')
}

/**
 * twitter:site handle (base.html). Omitted entirely when the brand has no
 * X/Twitter handle, rather than emitting one it does not own.
 * @param {string} i
 */
function twitterSite(i) {
  return SOCIAL_HANDLE
    ? `${i}<meta name="twitter:site" content="${SOCIAL_HANDLE}" />`
    : ''
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
 * @param {boolean} [optional] when true, return content unchanged if the
 *   markers are absent (for regions that live in only one of the two files)
 */
function regenRegion(content, id, kind, build, optional = false) {
  const open = kind === 'css' ? '/\\*' : '<!--'
  const close = kind === 'css' ? '\\*/' : '-->'
  const startRe = new RegExp(
    `([ \\t]*)${open} BRAND-GEN:${id} start[\\s\\S]*?${close}`,
  )
  const endRe = new RegExp(`[ \\t]*${open} BRAND-GEN:${id} end ${close}`)
  const sm = content.match(startRe)
  const em = content.match(endRe)
  if (!sm || !em || sm.index === undefined || em.index === undefined) {
    if (optional) return content
    throw new Error(`BRAND-GEN:${id} markers not found`)
  }
  const indent = sm[1]
  const startEnd = sm.index + sm[0].length
  return (
    content.slice(0, startEnd) +
    '\n' +
    build(indent) +
    '\n' +
    content.slice(em.index)
  )
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

  // Brand text identity (brand.json). The og/twitter block lives only in
  // web/index.html; the twitter:site tag only in base.html - both optional so
  // the other file passes through untouched.
  out = regenRegion(out, 'meta', 'html', metaBlock, true)
  out = regenRegion(out, 'twitter-site', 'html', twitterSite, true)

  // base.html scattered brand text (no-ops on files that lack each pattern).
  out = out.replace(
    /(<title>\{%- block head_title -%\})[^<]*?(\{%- endblock -%\}<\/title>)/,
    `$1${BRAND_NAME}$2`,
  )
  out = out.replace(
    /(<meta name="application-name" content=")[^"]*(">)/,
    `$1${BRAND_NAME}$2`,
  )
  out = out.replace(
    /(<meta property="og:site_name" content=")[^"]*(">)/,
    `$1${BRAND_NAME}$2`,
  )
  out = out.replace(
    /Learn more about .+? at <a href="https:\/\/[^"]+">[^<]+<\/a>/,
    `Learn more about ${BRAND_NAME} at <a href="https://${BRAND_HOST}">${BRAND_HOST}</a>`,
  )
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
