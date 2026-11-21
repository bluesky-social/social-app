/**
 * Height mix for a batch of content rows. Initial rows are always `mixed`;
 * prepended batches can be skewed so they mount shorter or taller than
 * VirtualizedList's running-average estimate.
 */
export type HeightProfile = 'mixed' | 'short' | 'tall'

export type LabRow = {
  /** Stable key. Also the cell key VirtualizedList tracks. */
  id: string
  kind: 'leading' | 'content'
  /** Timeline position, newest highest. `-1` for leading rows. */
  seq: number
  /** `0` for the initial rows, then one per prepend. `-1` for leading rows. */
  batch: number
  /** Final laid-out height, in points. */
  height: number
}

/** Height of a leading non-content row, roughly PostFeed's composer prompt. */
export const LEADING_ROW_HEIGHT = 72

const FIRST_INITIAL_SEQ = 1000

/**
 * A 32-bit integer hash of `(seed, n)`, mapped to `[0, 1)`. Heights are a pure
 * function of seed and position rather than of generation order, so a row
 * always has the same height however the list got to it.
 */
function random(seed: number, n: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(n, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function between(r: number, min: number, max: number) {
  return Math.round(min + r * (max - min))
}

/**
 * `mixed` averages about 310pt, which is what VirtualizedList ends up using
 * as its estimate for every unmeasured row. `short` rows (64-120pt) mount far
 * shorter than that and `tall` rows (600-1400pt) far taller.
 */
export function rowHeight(
  seed: number,
  seq: number,
  profile: HeightProfile,
): number {
  const bucket = random(seed, seq * 2)
  const r = random(seed, seq * 2 + 1)
  switch (profile) {
    case 'short':
      return between(r, 64, 120)
    case 'tall':
      return between(r, 600, 1400)
    case 'mixed':
      // text post
      if (bucket < 0.62) return between(r, 80, 220)
      // post with media
      if (bucket < 0.9) return between(r, 260, 520)
      // tall post
      if (bucket < 0.97) return between(r, 700, 1000)
      // taller than a phone screen
      return between(r, 1300, 2000)
  }
}

function contentRow(
  seed: number,
  seq: number,
  batch: number,
  profile: HeightProfile,
): LabRow {
  return {
    id: `post-${seq}`,
    kind: 'content',
    seq,
    batch,
    height: rowHeight(seed, seq, profile),
  }
}

export function createInitialRows({
  seed,
  count,
  leadingRows,
}: {
  seed: number
  count: number
  leadingRows: number
}): LabRow[] {
  const rows: LabRow[] = []
  for (let i = 0; i < leadingRows; i++) {
    rows.push({
      id: `leading-${i}`,
      kind: 'leading',
      seq: -1,
      batch: -1,
      height: LEADING_ROW_HEIGHT,
    })
  }
  for (let i = 0; i < count; i++) {
    rows.push(contentRow(seed, FIRST_INITIAL_SEQ - i, 0, 'mixed'))
  }
  return rows
}

/**
 * Inserts `count` newer rows directly below the leading rows, newest first,
 * the way a feed prepend lands under PostFeed's composer prompt.
 */
export function prependRows(
  rows: LabRow[],
  {seed, count, profile}: {seed: number; count: number; profile: HeightProfile},
): LabRow[] {
  let insertAt = 0
  let topSeq = FIRST_INITIAL_SEQ
  let lastBatch = 0
  for (const row of rows) {
    if (row.kind === 'leading') {
      insertAt++
    } else {
      topSeq = Math.max(topSeq, row.seq)
      lastBatch = Math.max(lastBatch, row.batch)
    }
  }
  const fresh: LabRow[] = []
  for (let i = count; i >= 1; i--) {
    fresh.push(contentRow(seed, topSeq + i, lastBatch + 1, profile))
  }
  return [...rows.slice(0, insertAt), ...fresh, ...rows.slice(insertAt)]
}
