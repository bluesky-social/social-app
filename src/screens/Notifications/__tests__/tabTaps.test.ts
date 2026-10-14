import {describe, expect, it} from '@jest/globals'

import {createTabTaps} from '#/screens/Notifications/tabTaps'

describe('createTabTaps', () => {
  it('counts a page selected after its pill was tapped as a tap, once', () => {
    const taps = createTabTaps()
    taps.tap(2, 0)
    expect(taps.take(2, 300)).toBe(true)
    expect(taps.take(2, 400)).toBe(false)
  })

  it('counts a swipe to a page that was never tapped as a swipe', () => {
    expect(createTabTaps().take(1, 0)).toBe(false)
  })

  it('counts every page tapped in quick succession, if they come in order', () => {
    const taps = createTabTaps()
    taps.tap(1, 0)
    taps.tap(2, 50)
    expect(taps.take(1, 300)).toBe(true)
    expect(taps.take(2, 600)).toBe(true)
  })

  it("doesn't let a tap the pager skipped over make a later swipe look like a tap", () => {
    const taps = createTabTaps()
    taps.tap(1, 0)
    taps.tap(2, 50)
    // The pager went straight to the last one
    expect(taps.take(2, 300)).toBe(true)
    // A swipe back to the first, a while later
    expect(taps.take(1, 10_000)).toBe(false)
  })
})
