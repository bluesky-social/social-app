import {ITEM_GAP} from '#/components/Gallery/const'
import {
  getIndexForOffset,
  getMaxOffset,
  getOffsetForIndex,
  getRevealOffset,
  getTotalWidth,
} from '#/components/Gallery/utils'

function widths(...ws: number[]) {
  return new Map(ws.map((w, i) => [i, w]))
}

describe('getOffsetForIndex', () => {
  it('is 0 for the first item', () => {
    expect(getOffsetForIndex(widths(100, 200), 0)).toBe(0)
  })

  it('sums unequal widths and gaps', () => {
    const w = widths(100, 220, 140)
    expect(getOffsetForIndex(w, 1)).toBe(100 + ITEM_GAP)
    expect(getOffsetForIndex(w, 2)).toBe(100 + 220 + 2 * ITEM_GAP)
  })

  it('treats unmeasured items as zero width', () => {
    expect(getOffsetForIndex(new Map(), 2)).toBe(2 * ITEM_GAP)
  })
})

describe('getIndexForOffset', () => {
  const w = widths(100, 200, 100)

  it('stays on an item until it is more than halfway out', () => {
    // first slot is 108 wide, so the boundary is at 54
    expect(getIndexForOffset(w, 0, 3)).toBe(0)
    expect(getIndexForOffset(w, 53, 3)).toBe(0)
    expect(getIndexForOffset(w, 54, 3)).toBe(1)
  })

  it('uses each item width at the gap boundaries', () => {
    // second slot starts at 108 and is 208 wide, so the boundary is 108 + 104
    expect(getIndexForOffset(w, 211, 3)).toBe(1)
    expect(getIndexForOffset(w, 212, 3)).toBe(2)
  })

  it('clamps past the end', () => {
    expect(getIndexForOffset(w, 99999, 3)).toBe(2)
  })

  it('handles empty and single galleries', () => {
    expect(getIndexForOffset(new Map(), 50, 0)).toBe(0)
    expect(getIndexForOffset(widths(300), 250, 1)).toBe(0)
  })
})

describe('getTotalWidth and getMaxOffset', () => {
  it('is 0 when empty', () => {
    expect(getTotalWidth(new Map(), 0)).toBe(0)
    expect(getMaxOffset(new Map(), 0, 300)).toBe(0)
  })

  it('counts gaps between but not around items', () => {
    expect(getTotalWidth(widths(100, 200), 2)).toBe(100 + ITEM_GAP + 200)
    expect(getTotalWidth(widths(100), 1)).toBe(100)
  })

  it('cannot scroll when everything fits', () => {
    expect(getMaxOffset(widths(100), 1, 300)).toBe(0)
  })

  it('scrolls the overflow', () => {
    expect(getMaxOffset(widths(200, 200), 2, 300)).toBe(
      200 + ITEM_GAP + 200 - 300,
    )
  })
})

describe('getRevealOffset', () => {
  const w = widths(200, 200, 200, 200)
  const base = {itemWidths: w, itemCount: 4, viewportWidth: 300}

  it('does nothing for a fully visible item', () => {
    expect(getRevealOffset({...base, index: 0, currentOffset: 0})).toBe(0)
  })

  it('scrolls forward just enough to show the end of an item', () => {
    // item 1 spans 208-408, viewport is 300 wide
    expect(getRevealOffset({...base, index: 1, currentOffset: 0})).toBe(108)
  })

  it('scrolls back just enough to show the start of an item', () => {
    expect(getRevealOffset({...base, index: 1, currentOffset: 400})).toBe(208)
  })

  it('does nothing for an item already within the viewport', () => {
    expect(getRevealOffset({...base, index: 1, currentOffset: 150})).toBe(150)
  })

  it('clamps to the scrollable range', () => {
    // item 3 would want 624 + 200 - 300 = 524, which is the max
    expect(getRevealOffset({...base, index: 3, currentOffset: 0})).toBe(524)
    expect(getRevealOffset({...base, index: 3, currentOffset: 9999})).toBe(524)
  })

  it('never scrolls past the end when a short last item is revealed', () => {
    // 316 wide in total, so 16 is as far as it goes
    const short = widths(100, 100, 100)
    expect(
      getRevealOffset({
        itemWidths: short,
        itemCount: 3,
        index: 2,
        viewportWidth: 300,
        currentOffset: 300,
      }),
    ).toBe(16)
  })

  it('aligns the leading edge of items wider than the viewport', () => {
    const wide = widths(100, 500, 100)
    const args = {itemWidths: wide, itemCount: 3, index: 1, viewportWidth: 300}
    const start = 100 + ITEM_GAP
    // same answer whichever side we come from
    expect(getRevealOffset({...args, currentOffset: 0})).toBe(start)
    expect(getRevealOffset({...args, currentOffset: 500})).toBe(start)
    expect(getRevealOffset({...args, currentOffset: start})).toBe(start)
  })

  it('ignores invalid indices', () => {
    for (const index of [-1, 4, 1.5, NaN]) {
      expect(getRevealOffset({...base, index, currentOffset: 42})).toBe(42)
    }
  })

  it('is a no-op for an empty gallery', () => {
    expect(
      getRevealOffset({
        itemWidths: new Map(),
        itemCount: 0,
        index: 0,
        viewportWidth: 300,
        currentOffset: 0,
      }),
    ).toBe(0)
  })

  it('uses a new viewport width after a resize', () => {
    const args = {...base, index: 1, currentOffset: 0}
    expect(getRevealOffset({...args, viewportWidth: 300})).toBe(108)
    expect(getRevealOffset({...args, viewportWidth: 500})).toBe(0)
  })
})
