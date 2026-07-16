import {
  computeWidths,
  decimate,
  DECIMATION_MIN_DISTANCE,
  MIN_WIDTH_FRACTION,
  shouldKeepPoint,
} from '../geometry'
import {
  addStroke,
  canRedo,
  canUndo,
  clearStrokes,
  emptyHistory,
  redo,
  undo,
} from '../history'
import {type Brush, type Point, type Stroke} from '../types'

const pt = (x: number, y: number, t = 0, p = 1): Point => ({x, y, p, t})
const brush: Brush = {color: '#000000', size: 20, opacity: 1, mode: 'draw'}

const strokeFrom = (id: string, points: Point[], b: Brush = brush): Stroke => ({
  id,
  brush: b,
  points,
  seed: 1,
})

describe('decimation (§6.1)', () => {
  it('drops points closer than the min distance but keeps the endpoints', () => {
    const pts = [pt(0, 0), pt(0.5, 0), pt(1, 0), pt(50, 0), pt(50.2, 0)]
    const out = decimate(pts)
    expect(out[0]).toEqual(pts[0])
    expect(out[out.length - 1]).toEqual(pts[pts.length - 1])
    // Every retained gap is at least the threshold, except the forced last point.
    for (let i = 1; i < out.length - 1; i++) {
      expect(
        Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y),
      ).toBeGreaterThanOrEqual(DECIMATION_MIN_DISTANCE)
    }
    expect(out.length).toBeLessThan(pts.length)
  })

  it('shouldKeepPoint always keeps the first sample', () => {
    expect(shouldKeepPoint(undefined, pt(0, 0))).toBe(true)
    expect(shouldKeepPoint(pt(0, 0), pt(0.1, 0))).toBe(false)
    expect(shouldKeepPoint(pt(0, 0), pt(5, 0))).toBe(true)
  })
})

describe('width dynamics (§6.3)', () => {
  it('makes slow strokes thicker than fast strokes', () => {
    // Same spatial gap, different elapsed time => different speed.
    const slow = [pt(0, 0, 0), pt(10, 0, 100)]
    const fast = [pt(0, 0, 0), pt(10, 0, 2)]
    const slowW = computeWidths(slow, brush)[1]
    const fastW = computeWidths(fast, brush)[1]
    expect(slowW).toBeGreaterThan(fastW)
  })

  it('never exceeds base size or drops below the min fraction', () => {
    const pts = [pt(0, 0, 0), pt(200, 0, 1), pt(400, 0, 2)]
    for (const w of computeWidths(pts, brush)) {
      expect(w).toBeLessThanOrEqual(brush.size + 1e-6)
      expect(w).toBeGreaterThanOrEqual(brush.size * MIN_WIDTH_FRACTION - 1e-6)
    }
  })

  it('scales the baseline by pressure', () => {
    const light = [pt(0, 0, 0, 0.5), pt(10, 0, 100, 0.5)]
    const full = [pt(0, 0, 0, 1), pt(10, 0, 100, 1)]
    expect(computeWidths(light, brush)[1]).toBeLessThan(
      computeWidths(full, brush)[1],
    )
  })
})

describe('undo/redo command stack (§6.4)', () => {
  it('adds, undoes, and redoes strokes', () => {
    let s = emptyHistory()
    s = addStroke(s, strokeFrom('a', [pt(0, 0)]))
    s = addStroke(s, strokeFrom('b', [pt(1, 1)]))
    expect(s.strokes.map(x => x.id)).toEqual(['a', 'b'])
    expect(canUndo(s)).toBe(true)

    s = undo(s)
    expect(s.strokes.map(x => x.id)).toEqual(['a'])
    expect(canRedo(s)).toBe(true)

    s = redo(s)
    expect(s.strokes.map(x => x.id)).toEqual(['a', 'b'])
  })

  it('clears the redo stack when a new stroke is drawn', () => {
    let s = emptyHistory()
    s = addStroke(s, strokeFrom('a', [pt(0, 0)]))
    s = undo(s)
    expect(canRedo(s)).toBe(true)
    s = addStroke(s, strokeFrom('c', [pt(2, 2)]))
    expect(canRedo(s)).toBe(false)
    expect(s.strokes.map(x => x.id)).toEqual(['c'])
  })

  it('treats clear as a single undoable command', () => {
    let s = emptyHistory()
    s = addStroke(s, strokeFrom('a', [pt(0, 0)]))
    s = addStroke(s, strokeFrom('b', [pt(1, 1)]))
    s = clearStrokes(s)
    expect(s.strokes).toEqual([])
    s = undo(s)
    expect(s.strokes.map(x => x.id)).toEqual(['a', 'b'])
  })
})
