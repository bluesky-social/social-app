/** One draggable pill: what sits in the row, and the copy that follows the finger. */
export type SortableItem = {
  key: string
  /** Read to screen readers as the thing being reordered. */
  label: string
  node: React.ReactNode
  ghost: React.ReactNode
}

export type SortablePillsProps = {
  items: SortableItem[]
  onReorder: (keys: string[]) => void
  onDragStateChange?: (dragging: boolean) => void
  /** Rendered after the pills, e.g. the "Add link" pill. Not draggable. */
  trailing?: React.ReactNode
}

/** Width of the strip at a pill's right end where a drag starts at once. */
export const GRIP_ZONE = 36

/** How long a press elsewhere on a pill is held before it turns into a drag. */
export const HOLD_MS = 250

/** Gap between pills, and between wrapped rows; the row uses `gap_sm`. */
export const GAP = 8
/** Key for the non-draggable trailing pill in the layout pass. */
export const TRAILING = '__trailing'

export type Size = {w: number; h: number}
export type Frame = {x: number; y: number; w: number; h: number}
export type Point = {x: number; y: number}

/**
 * Replays the row's wrap layout for an order, from each pill's size. Positions
 * are relative to the row's top-left. The trailing pill, when present, always
 * comes last. Runs on the UI thread on native, so no closures over React state.
 */
export function layoutFor(
  order: string[],
  sizes: Record<string, Size>,
  rowWidth: number,
  withTrailing: boolean,
): Record<string, Frame> {
  'worklet'
  const out: Record<string, Frame> = {}
  let x = 0
  let y = 0
  let rowH = 0
  const keys = withTrailing ? [...order, TRAILING] : order
  for (const key of keys) {
    const s = sizes[key]
    if (!s) continue
    if (x > 0 && x + s.w > rowWidth + 0.5) {
      x = 0
      y += rowH + GAP
      rowH = 0
    }
    out[key] = {x, y, w: s.w, h: s.h}
    x += s.w + GAP
    rowH = Math.max(rowH, s.h)
  }
  return out
}

/** The height a laid-out row needs; `sizes` fills in heights if the frames lack them. */
export function rowHeightFor(
  frames: Record<string, Frame>,
  sizes?: Record<string, Size>,
): number {
  'worklet'
  let h = 0
  for (const key of Object.keys(frames)) {
    const f = frames[key]
    const fh = f.h || sizes?.[key]?.h || 0
    h = Math.max(h, f.y + fh)
  }
  return h
}

/** True when both lists hold the same keys, in any order. */
export function isSameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every(item => set.has(item))
}
