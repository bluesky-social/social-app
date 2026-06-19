// @ts-check
/**
 * Brand favicon generator (white-label).
 *
 * Regenerates the web/SSR favicon set + the Safari pinned-tab mask from ONE
 * master square icon. To rebrand the favicons: replace MASTER with your tile
 * (a square, full-bleed PNG; 1024x1024 recommended) and run
 * `pnpm brand:gen-favicons`. Native app icons + the dynamic-icon set are NOT
 * touched here - Expo fans those out from app.config.js separately.
 *
 * Uses @expo/image-utils (already an Expo dependency; backend is bundled
 * jimp-compact) rather than `sharp`, so it needs no extra install and runs
 * cross-platform. It prints a "consider installing sharp" notice - harmless.
 *
 * Rounded corners: browsers render a favicon's PNG literally (no auto-rounding,
 * unlike iOS home-screen icons), so the rounded-tile look has to be baked into
 * the browser favicons here. apple-touch-icon is the exception - iOS applies its
 * own squircle mask and wants a full-bleed opaque square - so it is left square.
 *
 * The Safari pinned-tab is a monochrome silhouette of the wordmark, generated
 * from the brand logo (brand-logo.generated.json / assets/brand/mark.svg, no
 * raster step); Safari tints it via the
 * <link rel="mask-icon" color="..."> attribute that the web codegen sets from
 * the brand accent.
 */
import {readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const require = createRequire(import.meta.url)
const {generateImageAsync} = require('@expo/image-utils')
const Jimp = require('jimp-compact')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The one master image. Replace this file (or repoint) to rebrand favicons. */
const MASTER = join(root, 'assets/app-icons/ios_icon_default_next.png')

/** Corner radius as a fraction of icon size (0 = square, 0.5 = circle). */
const CORNER_RADIUS_RATIO = 0.35

/** [output path relative to repo root, square size in px, round corners?]. */
const PNG_TARGETS = [
  ['bskyweb/static/favicon-16x16.png', 16, true],
  ['bskyweb/static/favicon-32x32.png', 32, true],
  ['bskyweb/static/favicon.png', 48, true],
  // apple-touch-icon: iOS masks it itself and wants a full-bleed opaque square.
  ['bskyweb/static/apple-touch-icon.png', 180, false],
  ['bskyweb/embedr-static/favicon-16x16.png', 16, true],
  ['bskyweb/embedr-static/favicon-32x32.png', 32, true],
  ['bskyweb/embedr-static/favicon.png', 48, true],
  // Expo web favicon source; Expo downscales it for the web tab icon.
  ['assets/favicon.png', 512, true],
]

/**
 * Punch anti-aliased rounded corners into a square RGBA PNG buffer. Multiplies
 * each pixel's alpha by its coverage of the rounded rect (1px feather at the
 * arc edge), so the corners outside the radius become transparent.
 * @param {Buffer} buf
 * @param {number} size
 * @returns {Promise<Buffer>}
 */
async function roundCorners(buf, size) {
  const img = await Jimp.read(buf)
  const {data, width, height} = img.bitmap
  const r = size * CORNER_RADIUS_RATIO
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5
      const py = y + 0.5
      // Nearest point on the inset rect whose corners are arc centers; in edge
      // and center regions dx or dy is 0, so dist is 0 and coverage is 1.
      const cx = Math.min(Math.max(px, r), width - r)
      const cy = Math.min(Math.max(py, r), height - r)
      const dx = px - cx
      const dy = py - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const coverage = Math.min(Math.max(r - dist + 0.5, 0), 1)
      if (coverage < 1) {
        const idx = (y * width + x) * 4
        data[idx + 3] = Math.round(data[idx + 3] * coverage)
      }
    }
  }
  return img.getBufferAsync(Jimp.MIME_PNG)
}

async function main() {
  for (const [rel, size, round] of PNG_TARGETS) {
    const {source} = await generateImageAsync(
      {},
      {
        src: MASTER,
        name: rel.split('/').pop(),
        width: size,
        height: size,
        // master is a full-bleed square tile -> straight square downscale
        resizeMode: 'cover',
      },
    )
    const out = round ? await roundCorners(source, size) : source
    writeFileSync(join(root, rel), out)
    console.log(`  ${rel}  ${size}x${size}${round ? '  (rounded)' : ''}`)
  }

  const logo = JSON.parse(
    readFileSync(join(root, 'src/config/brand-logo.generated.json'), 'utf8'),
  )
  // Monochrome silhouette: the mark SVG with its fills stripped (paths default
  // to black), which Safari then tints via the <link rel="mask-icon"> colour.
  const safari = logo.mark.xml.replace(/\sfill="[^"]*"/g, '') + '\n'
  const safariPath = 'bskyweb/static/safari-pinned-tab.svg'
  writeFileSync(join(root, safariPath), safari)
  console.log(`  ${safariPath}  (monochrome wordmark mask)`)

  console.log(`\nDone. Master: ${MASTER.replace(root + '/', '')}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
