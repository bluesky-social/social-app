import {describe, expect, it} from '@jest/globals'

import {
  classifyRun,
  detectOscillation,
  type ScrollSample,
  type VerdictInput,
} from './analysis'

const base: VerdictInput = {
  hasAnchor: true,
  moving: false,
  oscillating: false,
  anchorMeasured: true,
  drift: 0,
  offsetDelta: 3231,
  insertedAbove: 3231,
  lostEarly: false,
  jumpExcess: null,
}

describe('classifyRun', () => {
  it('holds when the correction lands (scenario 1)', () => {
    expect(classifyRun(base)).toBe('held')
  })

  it('drifts when a correction lands short (scenario 4 at rest)', () => {
    expect(classifyRun({...base, offsetDelta: 3114, drift: -463.3})).toBe(
      'drifted',
    )
  })

  it('is pushed down when no correction runs and the anchor unmounts (scenario 6, minIndexForVisible 0)', () => {
    expect(
      classifyRun({
        ...base,
        anchorMeasured: false,
        drift: null,
        offsetDelta: 0,
        insertedAbove: 3733,
      }),
    ).toBe('pushedDown')
  })

  it('is pushed down when no correction runs and the anchor stays mounted', () => {
    expect(
      classifyRun({...base, drift: 3733, offsetDelta: 0, insertedAbove: 3733}),
    ).toBe('pushedDown')
  })

  it('is lost when the anchor is gone and the offset moved (scenario 5 teleport)', () => {
    expect(
      classifyRun({
        ...base,
        anchorMeasured: false,
        drift: null,
        offsetDelta: -982,
        insertedAbove: 6200,
      }),
    ).toBe('lost')
  })

  it('is lost when nothing was inserted and the anchor vanished', () => {
    expect(
      classifyRun({
        ...base,
        anchorMeasured: false,
        drift: null,
        offsetDelta: 0,
        insertedAbove: 0,
      }),
    ).toBe('lost')
  })

  it('judges moving runs on discontinuities', () => {
    const moving = {...base, moving: true, drift: -1700, offsetDelta: 1500}
    expect(classifyRun(moving)).toBe('smooth')
    expect(classifyRun({...moving, jumpExcess: 1400})).toBe('jumped')
    expect(classifyRun({...moving, lostEarly: true})).toBe('lost')
  })

  it('reports an oscillation over anything else', () => {
    expect(classifyRun({...base, oscillating: true})).toBe('oscillating')
    expect(classifyRun({...base, moving: true, oscillating: true})).toBe(
      'oscillating',
    )
  })

  it('needs an anchor', () => {
    expect(classifyRun({...base, hasAnchor: false})).toBe('unmeasured')
  })
})

/** Offset and content height flipping together, one event every `stepMs`. */
function loop({
  from,
  count,
  stepMs,
  amplitude,
}: {
  from: number
  count: number
  stepMs: number
  amplitude: number
}): ScrollSample[] {
  return Array.from({length: count}, (_, i) => {
    const up = i % 2 === 1
    return {
      t: from + i * stepMs,
      y: 4000 + (up ? amplitude : 0),
      contentHeight: 60000 + (up ? amplitude : 0),
    }
  })
}

describe('detectOscillation', () => {
  it('finds the post-prepend loop, with its period and amplitude', () => {
    const samples = loop({from: 0, count: 40, stepMs: 70, amplitude: 603})
    const last = samples[samples.length - 1].t
    const osc = detectOscillation(samples, last + 10)
    expect(osc).not.toBeNull()
    expect(osc?.amplitude).toBe(603)
    expect(osc?.periodMs).toBe(140)
    expect(osc?.ratePerSec).toBeCloseTo(1000 / 70, 0)
    expect(osc?.offsetMinusContent).toBe(4000 - 60000)
  })

  it('finds a loop that cycles through more than two positions', () => {
    // +286, +385, -671: three positions, one cycle every three events.
    const deltas = [286, 385, -671]
    const samples: ScrollSample[] = [{t: 0, y: 4000, contentHeight: 60000}]
    for (let i = 1; i < 45; i++) {
      const prev = samples[i - 1]
      const dy = deltas[(i - 1) % 3]
      samples.push({
        t: i * 70,
        y: prev.y + dy,
        contentHeight: prev.contentHeight + dy,
      })
    }
    const osc = detectOscillation(samples, 44 * 70 + 10)
    expect(osc).not.toBeNull()
    expect(osc?.periodMs).toBe(210)
    expect(osc?.amplitude).toBe(671)
  })

  it('ignores a loop shorter than two seconds, like a settling ring', () => {
    const samples = loop({from: 0, count: 10, stepMs: 70, amplitude: 603})
    expect(detectOscillation(samples, 700)).toBeNull()
  })

  it('ignores a loop that has stopped', () => {
    const samples = loop({from: 0, count: 40, stepMs: 70, amplitude: 603})
    expect(detectOscillation(samples, 2730 + 1000)).toBeNull()
  })

  it('ignores a fling, which moves the offset but not the content height', () => {
    const samples = Array.from({length: 150}, (_, i) => ({
      t: i * 16,
      y: 1000 + i * 40 - (i % 2) * 10,
      contentHeight: 60000,
    }))
    expect(detectOscillation(samples, 150 * 16)).toBeNull()
  })

  it('ignores steady growth, which moves both but never flips', () => {
    const samples = Array.from({length: 40}, (_, i) => ({
      t: i * 70,
      y: 1000 + i * 300,
      contentHeight: 60000 + i * 300,
    }))
    expect(detectOscillation(samples, 40 * 70)).toBeNull()
  })
})
