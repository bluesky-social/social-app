import {describe, expect, it} from '@jest/globals'

import {fitAvatarCount} from '#/screens/Notifications/components/NotificationItem/Item/avatarRow'

/*
 * Each avatar takes 36 (28 and a gap of 8). The toggle takes 32 with just
 * the chevron, or 56 with a "+N" chip.
 */
describe('fitAvatarCount', () => {
  it('shows everyone, without a chip, when they all fit', () => {
    // 6 * 36 + 32 = 248
    expect(
      fitAvatarCount({width: 248, resolved: 6, total: 6, hasToggle: true}),
    ).toBe(6)
  })

  it('makes room for the chip once everyone no longer fits', () => {
    // 247 is too narrow for all 6 and the chevron, and (247 - 56) / 36 = 5.3
    expect(
      fitAvatarCount({width: 247, resolved: 6, total: 6, hasToggle: true}),
    ).toBe(5)
  })

  it('always leaves room for the chip when some people are unresolved', () => {
    // There's room for all 3 profiles, but 17 more people need the chip
    expect(
      fitAvatarCount({width: 1000, resolved: 3, total: 20, hasToggle: true}),
    ).toBe(3)
    // (148 - 56) / 36 = 2.5, a phone row beside a thumbnail
    expect(
      fitAvatarCount({width: 148, resolved: 9, total: 20, hasToggle: true}),
    ).toBe(2)
  })

  it('never shows more than fit, even if that means none', () => {
    expect(
      fitAvatarCount({width: 60, resolved: 9, total: 20, hasToggle: true}),
    ).toBe(0)
  })

  it('needs no room for a toggle when there is none', () => {
    // A pair named in full: one avatar, 28 wide
    expect(
      fitAvatarCount({width: 28, resolved: 1, total: 1, hasToggle: false}),
    ).toBe(1)
  })
})
