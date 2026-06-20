// @ts-check
/**
 * OPTIONAL raster generator - app icon + OG image from the brand SVGs.
 *
 * Deliberately NOT a project dependency. It auto-detects a rasterizer and skips
 * gracefully if none is installed, so normal dev / `pnpm brand` / CI never need
 * one. Run it by hand only when the logo changes:
 *
 *   pnpm brand:gen-raster              from assets/brand/{icon,og}.svg if present
 *   pnpm brand:gen-raster --compose    also compose defaults from the mark for
 *                                      brands that ship no designed icon/OG
 *   pnpm brand:gen-raster --out /tmp   write to a dir instead of in place (dry run)
 *
 * Rasterizer, in priority order (first one found wins):
 *   1. @resvg/resvg-js   (optional node module; `npm i -g` it or install locally,
 *                         never committed - it is not in package.json)
 *   2. rsvg-convert      (system; `brew install librsvg`)
 *   3. magick / convert  (system ImageMagick)
 *
 * NON-DESTRUCTIVE: only writes an output when its SVG source exists (icon.svg ->
 * icon master, og.svg -> og-image), or, with --compose, composes defaults. A
 * brand with hand-designed raster art (like mu's bespoke OG) simply ships no
 * source SVGs and is never touched.
 */
import {execFileSync, spawnSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BRAND_DIR = path.join(ROOT, 'assets/brand')
const LOGO = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/config/brand-logo.generated.json'), 'utf8'),
)
const BRAND = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/config/brand.json'), 'utf8'),
)
const A = BRAND.colors.accents[BRAND.colors.defaultAccent]
const N = BRAND.colors.neutral

const argv = process.argv.slice(2)
const COMPOSE = argv.includes('--compose')
const outIdx = argv.indexOf('--out')
const OUT_DIR = outIdx >= 0 ? path.resolve(argv[outIdx + 1]) : null

// Outputs (relative to ROOT, or redirected into --out as basenames).
const ICON_MASTER = 'assets/app-icons/ios_icon_default_next.png'
const OG_IMAGE = 'web/og-image.jpg'
const ICON_SIZE = 1024
const OG_W = 2400
const OG_H = 1600

/* -- rasterizer detection ------------------------------------------------- */

/** @type {null | ((svg: string, w: number, h: number) => Buffer)} */
let rasterize = null
let rasterizerName = 'none'

try {
  const {Resvg} = await import('@resvg/resvg-js')
  rasterize = (svg, w) => {
    const r = new Resvg(svg, {
      fitTo: {mode: 'width', value: w},
      background: 'rgba(0,0,0,0)',
    })
    return Buffer.from(r.render().asPng())
  }
  rasterizerName = '@resvg/resvg-js'
} catch {
  const has = cmd => spawnSync('which', [cmd]).status === 0
  if (has('rsvg-convert')) {
    rasterize = (svg, w, h) =>
      spawnSync('rsvg-convert', ['-w', String(w), '-h', String(h)], {
        input: svg,
        maxBuffer: 64 * 1024 * 1024,
      }).stdout
    rasterizerName = 'rsvg-convert'
  } else if (has('magick') || has('convert')) {
    const bin = has('magick') ? 'magick' : 'convert'
    rasterize = (svg, w, h) =>
      spawnSync(
        bin,
        ['-background', 'none', 'svg:-', '-resize', `${w}x${h}`, 'png:-'],
        {input: svg, maxBuffer: 64 * 1024 * 1024},
      ).stdout
    rasterizerName = bin
  }
}

if (!rasterize) {
  console.warn(
    'gen-raster: no rasterizer found - skipping (this is optional).\n' +
      '  Install ONE of these to regenerate raster assets:\n' +
      '    npm i -g @resvg/resvg-js   |   brew install librsvg   |   brew install imagemagick',
  )
  process.exit(0)
}
console.log(`gen-raster: using ${rasterizerName}`)

/* -- helpers -------------------------------------------------------------- */

/** Resolve currentColor + theme: tokens to concrete colours. */
function paint(xml, {current, palette = A}) {
  return xml
    .replace(/theme:([A-Za-z0-9_]+)/g, (_m, k) => palette[k] ?? current)
    .replace(/currentColor/g, current)
}

/** Inner content of an <svg> (drop the wrapping tags). */
function inner(xml) {
  return xml.replace(/^<svg\b[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')
}

/**
 * Compose a square/landscape tile: solid background + the given logo role
 * centred at `scale` of the width.
 */
function compose(role, {w, h, bg, fg, scale}) {
  const logo = LOGO[role] ?? LOGO.mark
  const lw = w * scale
  const lh = lw * logo.ratio
  const x = (w - lw) / 2
  const y = (h - lh) / 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${bg}"/>` +
    `<svg x="${x}" y="${y}" width="${lw}" height="${lh}" viewBox="${logo.viewBox}">` +
    paint(inner(logo.xml), {current: fg}) +
    `</svg></svg>`
  )
}

/** @param {string} rel @param {Buffer} buf */
function write(rel, buf) {
  const dest = OUT_DIR
    ? path.join(OUT_DIR, path.basename(rel))
    : path.join(ROOT, rel)
  fs.mkdirSync(path.dirname(dest), {recursive: true})
  fs.writeFileSync(dest, buf)
  console.log(`  wrote ${OUT_DIR ? dest : rel}`)
}

/* -- icon master ---------------------------------------------------------- */

const iconSvgPath = path.join(BRAND_DIR, 'icon.svg')
let wroteIcon = false
if (fs.existsSync(iconSvgPath)) {
  const svg = paint(fs.readFileSync(iconSvgPath, 'utf8'), {current: A.primary_500})
  write(ICON_MASTER, rasterize(svg, ICON_SIZE, ICON_SIZE))
  wroteIcon = true
} else if (COMPOSE) {
  // Default app icon: the mark in the accent on a light-accent tile.
  const svg = compose('mark', {
    w: ICON_SIZE,
    h: ICON_SIZE,
    bg: A.primary_50,
    fg: A.primary_500,
    scale: 0.68,
  })
  write(ICON_MASTER, rasterize(svg, ICON_SIZE, ICON_SIZE))
  wroteIcon = true
}

/* -- OG image ------------------------------------------------------------- */

const ogSvgPath = path.join(BRAND_DIR, 'og.svg')
if (fs.existsSync(ogSvgPath)) {
  const svg = paint(fs.readFileSync(ogSvgPath, 'utf8'), {current: N.contrast_0})
  write(OG_IMAGE, rasterize(svg, OG_W, OG_H))
} else if (COMPOSE) {
  // Default OG card: the lockup/mark in white on an accent field.
  const svg = compose('lockup', {
    w: OG_W,
    h: OG_H,
    bg: A.primary_500,
    fg: N.contrast_0,
    scale: 0.4,
  })
  write(OG_IMAGE, rasterize(svg, OG_W, OG_H))
}

/* -- favicons (only if we regenerated the icon master in place) ----------- */

if (wroteIcon && !OUT_DIR) {
  console.log('gen-raster: refreshing favicons from the new icon master')
  execFileSync('node', ['scripts/gen-brand-favicons.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  })
}

if (!wroteIcon && !fs.existsSync(ogSvgPath)) {
  console.log(
    'gen-raster: no icon.svg/og.svg sources' +
      (COMPOSE ? '' : ' (and no --compose)') +
      ' - nothing to do. Designed raster assets left untouched.',
  )
}
