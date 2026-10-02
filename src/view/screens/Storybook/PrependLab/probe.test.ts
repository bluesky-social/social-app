import {describe, expect, it, jest} from '@jest/globals'

import {Probe} from './probe'

function mockList(probe: Probe, generation: number) {
  const scrollToOffset = jest.fn()
  probe.setList(generation, {scrollToOffset})
  return scrollToOffset
}

describe('Probe list generations', () => {
  it('drops scroll events from a list retired by reset', () => {
    const probe = new Probe()
    const first = probe.currentGeneration()
    probe.onNativeScroll(first, 1022, 60000, 400)
    expect(probe.snapshot().offset).toBe(1022)

    const second = probe.reset()
    expect(second).not.toBe(first)
    // Queued events from the old list land after the reset.
    probe.onNativeScroll(first, 3830, 63830, 400)
    probe.onContentSizeChange(first, 390, 63830)
    probe.onDrag(first, true)

    const snap = probe.snapshot()
    expect(snap.offset).toBe(0)
    expect(snap.contentHeight).toBeNull()
    expect(snap.status).not.toBe('dragging')

    probe.onNativeScroll(second, 12, 60000, 400)
    expect(probe.snapshot().offset).toBe(12)
  })

  it('ignores the retired list detaching its ref after the new one attached', () => {
    const probe = new Probe()
    const first = probe.currentGeneration()
    mockList(probe, first)
    const second = probe.reset()
    const scrollToOffset = mockList(probe, second)
    probe.setList(first, null)
    probe.onViewportLayout(400)
    probe.scrollToTop()
    expect(scrollToOffset).toHaveBeenCalledWith({offset: 0, animated: false})
  })

  it('ignores rows of the retired list', () => {
    const probe = new Probe()
    const first = probe.currentGeneration()
    probe.mountRow(first, 'post-1000', 'content', {current: null})
    const second = probe.reset()
    probe.mountRow(first, 'post-999', 'content', {current: null})
    probe.mountRow(second, 'post-1000', 'content', {current: null})
    probe.unmountRow(first, 'post-1000')
    expect(probe.snapshot().rendered).toBe('none')
    probe.onRowsCommitted(
      second,
      [{id: 'post-1000', kind: 'content', seq: 1000, batch: 0, height: 100}],
      0,
    )
    expect(probe.snapshot().rendered).toBe('0 (1)')
  })

  it('keeps the list alive across dispose', () => {
    const probe = new Probe()
    const generation = probe.currentGeneration()
    probe.dispose()
    probe.onNativeScroll(generation, 50, 60000, 400)
    expect(probe.snapshot().offset).toBe(50)
  })
})

describe('Probe.scrollScreens', () => {
  it('scrolls by the measured list viewport, from the current offset', () => {
    const probe = new Probe()
    const generation = probe.currentGeneration()
    const scrollToOffset = mockList(probe, generation)
    probe.onViewportLayout(340.5)
    // A scroll event's layoutMeasurement doesn't override the layout height.
    probe.onNativeScroll(generation, 100, 60000, 415)
    probe.scrollScreens(3)
    expect(scrollToOffset).toHaveBeenCalledWith({
      offset: 100 + 3 * 340.5,
      animated: false,
    })
  })

  it('does nothing before the viewport has been measured', () => {
    const probe = new Probe()
    const scrollToOffset = mockList(probe, probe.currentGeneration())
    probe.scrollScreens(3)
    expect(scrollToOffset).not.toHaveBeenCalled()
  })
})

describe('Probe oscillation status', () => {
  it('reports the loop in the readout, and only without a gesture', () => {
    jest.useFakeTimers()
    try {
      const probe = new Probe()
      const generation = probe.currentGeneration()
      for (let i = 0; i < 40; i++) {
        const up = i % 2 === 1
        probe.onNativeScroll(
          generation,
          4000 + (up ? 603 : 0),
          60000 + (up ? 603 : 0),
          400,
        )
        jest.advanceTimersByTime(70)
      }
      const snap = probe.snapshot()
      expect(snap.status).toBe('oscillating')
      expect(snap.oscillation?.amplitude).toBe(603)
      expect(snap.oscillation?.periodMs).toBe(140)

      probe.onDrag(generation, true)
      expect(probe.snapshot().status).toBe('dragging')
      probe.onDrag(generation, false)

      jest.advanceTimersByTime(1000)
      expect(probe.snapshot().status).not.toBe('oscillating')
    } finally {
      jest.useRealTimers()
    }
  })
})
