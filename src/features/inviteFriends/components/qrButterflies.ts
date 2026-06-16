/**
 * Geometry helpers for rendering the Invite Friends QR code with butterfly data
 * modules (APP-2417).
 *
 * react-native-qrcode-styled draws every "on" module as a rounded square. To
 * draw butterflies instead we take over per-module rendering via its
 * `renderCustomPieceItem` hook, which bypasses the library's own eye + logo
 * handling, so we reproduce all of it here as plain SVG path strings.
 *
 * All paths are emitted in absolute QR-canvas coordinates (no per-element
 * transform) so the single canvas-wide `userSpaceOnUse` gradient maps
 * continuously across butterflies and eyes alike. Applying a transform per
 * element would instead remap the gradient into each element's local box.
 */

/** Finder ("eye") patterns are 7x7 modules in each non-bottom-right corner. */
export const FINDER_SIZE = 7

/**
 * Scale of each butterfly relative to a module. >1 lets neighbours overlap into
 * a denser, more legible silhouette. 1.2 matches the approved prototype and,
 * with error-correction level H, scans as reliably as solid squares.
 */
export const BUTTERFLY_PIECE_SCALE = 1.2

// Eye corner radii, in module units. Outer ~= 2.3 modules keeps the current
// design's 16px outer-corner look (16 / 7px piece).
const EYE_RADIUS_OUTER = 2.3
const EYE_RADIUS_CUT = 1.4
const EYE_RADIUS_DOT = 1.1

export type FinderCorner = 'topLeft' | 'topRight' | 'bottomLeft'

/**
 * The bsky butterfly outline (from the bsky-qr prototype), as a single closed
 * path over a 600x530 viewBox.
 */
const BSKY_PATH_DATA =
  'm135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z'
const BSKY_VIEW_W = 600
const BSKY_VIEW_H = 530

type BskyCmd =
  | {type: 'M'; x: number; y: number}
  | {
      type: 'C'
      x1: number
      y1: number
      x2: number
      y2: number
      x: number
      y: number
    }
  | {type: 'Z'}

/**
 * Parse the butterfly path once into normalized commands centered on (0,0) and
 * scaled to a unit box (uniform scale on the larger viewBox dimension). The path
 * only uses M/m, C/c and Z, so the parser handles just those.
 */
function parseBskyPath(): BskyCmd[] {
  const cmds: BskyCmd[] = []
  const tokens = BSKY_PATH_DATA.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g) ?? []
  const scale = 1 / Math.max(BSKY_VIEW_W, BSKY_VIEW_H)
  const offsetX = -(BSKY_VIEW_W * scale) / 2
  const offsetY = -(BSKY_VIEW_H * scale) / 2
  const norm = (x: number, y: number) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  })

  let i = 0
  let cx = 0
  let cy = 0
  let lastCmd = ''
  while (i < tokens.length) {
    const t = tokens[i]
    if (/[a-zA-Z]/.test(t)) {
      lastCmd = t
      i++
      if (lastCmd === 'Z' || lastCmd === 'z') cmds.push({type: 'Z'})
      continue
    }
    if (lastCmd === 'M' || lastCmd === 'm') {
      const x = parseFloat(tokens[i++])
      const y = parseFloat(tokens[i++])
      if (lastCmd === 'm') {
        cx += x
        cy += y
      } else {
        cx = x
        cy = y
      }
      cmds.push({type: 'M', ...norm(cx, cy)})
      lastCmd = lastCmd === 'm' ? 'l' : 'L'
    } else if (lastCmd === 'C' || lastCmd === 'c') {
      const x1 = parseFloat(tokens[i++])
      const y1 = parseFloat(tokens[i++])
      const x2 = parseFloat(tokens[i++])
      const y2 = parseFloat(tokens[i++])
      const x = parseFloat(tokens[i++])
      const y = parseFloat(tokens[i++])
      const rel = lastCmd === 'c'
      const ax1 = rel ? cx + x1 : x1
      const ay1 = rel ? cy + y1 : y1
      const ax2 = rel ? cx + x2 : x2
      const ay2 = rel ? cy + y2 : y2
      const ax = rel ? cx + x : x
      const ay = rel ? cy + y : y
      const p1 = norm(ax1, ay1)
      const p2 = norm(ax2, ay2)
      const p = norm(ax, ay)
      cmds.push({
        type: 'C',
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        x: p.x,
        y: p.y,
      })
      cx = ax
      cy = ay
    } else {
      i++
    }
  }
  return cmds
}

const BSKY_NORMALIZED = parseBskyPath()

/** A butterfly centered on (centerX, centerY), sized to `scale` canvas units. */
export function butterflyPiecePath(
  centerX: number,
  centerY: number,
  scale: number,
): string {
  const tx = (px: number) => centerX + px * scale
  const ty = (py: number) => centerY + py * scale
  let p = ''
  for (const c of BSKY_NORMALIZED) {
    if (c.type === 'M') {
      p += `M${tx(c.x)} ${ty(c.y)}`
    } else if (c.type === 'C') {
      p += `C${tx(c.x1)} ${ty(c.y1)} ${tx(c.x2)} ${ty(c.y2)} ${tx(c.x)} ${ty(c.y)}`
    } else {
      p += 'Z'
    }
  }
  return p
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const rr = Math.min(r, w / 2, h / 2)
  return (
    `M${x + rr} ${y} H${x + w - rr} A${rr} ${rr} 0 0 1 ${x + w} ${y + rr} ` +
    `V${y + h - rr} A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h} ` +
    `H${x + rr} A${rr} ${rr} 0 0 1 ${x} ${y + h - rr} ` +
    `V${y + rr} A${rr} ${rr} 0 0 1 ${x + rr} ${y} Z`
  )
}

/**
 * Returns the finder corner whose top-left module is (x, y), or null. Used to
 * emit each eye exactly once, at its anchor cell.
 */
export function finderCornerAnchor(
  x: number,
  y: number,
  n: number,
): FinderCorner | null {
  if (x === 0 && y === 0) return 'topLeft'
  if (x === n - FINDER_SIZE && y === 0) return 'topRight'
  if (x === 0 && y === n - FINDER_SIZE) return 'bottomLeft'
  return null
}

/** Whether (x, y) falls inside any of the three finder boxes. */
export function isInFinderRegion(x: number, y: number, n: number): boolean {
  return (
    (x < FINDER_SIZE && y < FINDER_SIZE) ||
    (x >= n - FINDER_SIZE && y < FINDER_SIZE) ||
    (x < FINDER_SIZE && y >= n - FINDER_SIZE)
  )
}

/**
 * A single even-odd path for one eye: outer rounded ring + inner cut + center
 * dot. Even-odd winding fills the ring band and the dot while leaving the gap
 * between them empty, reproducing a finder pattern.
 */
export function eyePath(
  corner: FinderCorner,
  n: number,
  pieceSize: number,
): string {
  const left = corner === 'topRight' ? (n - FINDER_SIZE) * pieceSize : 0
  const top = corner === 'bottomLeft' ? (n - FINDER_SIZE) * pieceSize : 0
  const size = FINDER_SIZE * pieceSize
  return [
    roundedRectPath(left, top, size, size, EYE_RADIUS_OUTER * pieceSize),
    roundedRectPath(
      left + pieceSize,
      top + pieceSize,
      size - 2 * pieceSize,
      size - 2 * pieceSize,
      EYE_RADIUS_CUT * pieceSize,
    ),
    roundedRectPath(
      left + 2 * pieceSize,
      top + 2 * pieceSize,
      3 * pieceSize,
      3 * pieceSize,
      EYE_RADIUS_DOT * pieceSize,
    ),
  ].join(' ')
}
