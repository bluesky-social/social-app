import {
  absorbAnchorCorrection,
  ANCHOR_CORRECTION_TOLERANCE,
  anchorCorrection,
  INITIAL_ANCHOR_CORRECTION_STATE,
  type ScrollEventKind,
} from './anchorCorrection'

/**
 * A scroll event at raw offset `y` with content `h` tall, and the drag's
 * velocity `v` where it has one.
 */
type FakeEvent = [kind: ScrollEventKind, y: number, h: number, v?: number]

/**
 * The offsets reported for `events`, taken in order from a fresh state.
 */
function report(events: FakeEvent[]): number[] {
  let state = INITIAL_ANCHOR_CORRECTION_STATE
  return events.map(([kind, y, h, v]) => {
    const next = absorbAnchorCorrection(state, kind, {
      contentOffset: {y},
      contentSize: {height: h},
      velocity: v === undefined ? undefined : {y: v},
    })
    state = next.state
    return next.offsetY
  })
}

describe('anchorCorrection', () => {
  it('is the content change when the offset moved with it', () => {
    expect(anchorCorrection({contentChange: 320, offsetChange: 320})).toBe(320)
    expect(anchorCorrection({contentChange: -529, offsetChange: -529})).toBe(
      -529,
    )
  })

  it('allows the tolerance between them, and no more', () => {
    const edge = 320 + ANCHOR_CORRECTION_TOLERANCE
    expect(anchorCorrection({contentChange: 320, offsetChange: edge})).toBe(320)
    expect(
      anchorCorrection({contentChange: 320, offsetChange: edge + 0.5}),
    ).toBe(0)
  })

  it('is nothing when the offset stayed where it was', () => {
    expect(anchorCorrection({contentChange: 400, offsetChange: 0})).toBe(0)
    expect(anchorCorrection({contentChange: 90, offsetChange: 40})).toBe(0)
  })

  it('ignores content changes too small to correct for', () => {
    expect(anchorCorrection({contentChange: 0.4, offsetChange: 0.4})).toBe(0)
    expect(anchorCorrection({contentChange: 0, offsetChange: 30})).toBe(0)
  })
})

describe('absorbAnchorCorrection', () => {
  it('reports a drag down and back up as it is', () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 1040, 5000],
        ['scroll', 1200, 5000],
        ['scroll', 1150, 5000],
        ['scroll', 900, 5000],
        ['endDrag', 900, 5000, 0],
      ]),
    ).toEqual([1000, 1040, 1200, 1150, 900, 900])
  })

  it('takes a correction for content growing above out of a drag', () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 1010, 5000],
        ['scroll', 1330, 5320],
        ['scroll', 1340, 5320],
        ['endDrag', 1340, 5320, 0],
      ]),
    ).toEqual([1000, 1010, 1010, 1020, 1020])
  })

  it('takes a correction for content shrinking above out of a drag', () => {
    expect(
      report([
        ['beginDrag', 1000, 5320],
        ['scroll', 1010, 5320],
        ['scroll', 690, 5000],
        ['scroll', 700, 5000],
        ['endDrag', 700, 5000, 0],
      ]),
    ).toEqual([1000, 1010, 1010, 1020, 1020])
  })

  it('takes out a ring of corrections both ways, leaving the drag', () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 980, 5000],
        ['scroll', 1300, 5320],
        ['scroll', 1280, 5320],
        ['scroll', 951, 4991],
        ['scroll', 931, 4991],
        ['scroll', 1251, 5311],
        ['endDrag', 1251, 5311, 0],
      ]),
    ).toEqual([1000, 980, 980, 960, 960, 940, 940, 940])
  })

  it('leaves growth below the viewport alone', () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 1000, 5400],
        ['scroll', 1060, 5400],
        // A fast scroll in the same event as a row mounting below.
        ['scroll', 1150, 5500],
        ['endDrag', 1150, 5500, 0],
      ]),
    ).toEqual([1000, 1000, 1060, 1150, 1150])
  })

  it("leaves the user's own movement in an event with a correction", () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 1321.5, 5320],
        ['scroll', 1001, 5000],
      ]),
    ).toEqual([1000, 1001.5, 1001])
  })

  it('keeps the shift through momentum and reports with it at the end', () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 1100, 5000],
        ['endDrag', 1100, 5000, 2.5],
        ['scroll', 1420, 5320],
        ['scroll', 1500, 5320],
        ['momentumEnd', 1500, 5320],
      ]),
    ).toEqual([1000, 1100, 1100, 1100, 1180, 1180])
  })

  it('starts again from nothing at the next drag', () => {
    expect(
      report([
        ['beginDrag', 1000, 5000],
        ['scroll', 1320, 5320],
        ['endDrag', 1320, 5320, 0],
        // At rest, a correction is reported as it is.
        ['scroll', 1640, 5640],
        ['beginDrag', 1640, 5640],
        ['scroll', 1660, 5640],
      ]),
    ).toEqual([1000, 1000, 1000, 1640, 1640, 1660])
  })

  it('reports as it is before any drag', () => {
    expect(
      report([
        ['scroll', 0, 5000],
        ['scroll', 320, 5320],
      ]),
    ).toEqual([0, 320])
  })
})
