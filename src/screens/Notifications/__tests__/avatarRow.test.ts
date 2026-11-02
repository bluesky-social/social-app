import {describe, expect, it} from '@jest/globals'

import {fitAvatarCount} from '#/screens/Notifications/components/NotificationItem/Item/avatarRow'

/**
 * Formats the "+N" as the app does in English, compacting thousands.
 */
function formatRemaining(remaining: number) {
  return remaining >= 1000
    ? `+${Math.floor(remaining / 100) / 10}K`
    : `+${remaining}`
}

/*
 * Each avatar takes 36 (28 and a gap of 8). The toggle takes 32 with just
 * the chevron. With a "+N" it takes 36 and 10 for each character of the
 * "+N", e.g. 66 for "+17" and 86 for "+1.2K".
 */
describe('fitAvatarCount', () => {
  it('shows everyone, without a "+N", when they all fit', () => {
    // 6 * 36 + 32 = 248
    expect(
      fitAvatarCount({
        width: 248,
        resolved: 6,
        total: 6,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(6)
  })

  it('makes room for the "+N" once everyone no longer fits', () => {
    // 247 is too narrow for all 6 and the chevron. 5 and "+1" take 236
    expect(
      fitAvatarCount({
        width: 247,
        resolved: 6,
        total: 6,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(5)
    // 235 is too narrow for that, and 4 and "+2" take 200
    expect(
      fitAvatarCount({
        width: 235,
        resolved: 6,
        total: 6,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(4)
  })

  it('always leaves room for the "+N" when some people are unresolved', () => {
    // There's room for all 3 profiles, but 17 more people need the "+N"
    expect(
      fitAvatarCount({
        width: 1000,
        resolved: 3,
        total: 20,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(3)
    // 2 and "+18" take 138, a phone row beside a thumbnail
    expect(
      fitAvatarCount({
        width: 148,
        resolved: 9,
        total: 20,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(2)
  })

  it('leaves more room for a longer "+N"', () => {
    // 4 and "+16" take 210
    expect(
      fitAvatarCount({
        width: 220,
        resolved: 9,
        total: 20,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(4)
    // 4 and "+1.2K" take 230, but 3 and "+1.2K" take 194
    expect(
      fitAvatarCount({
        width: 220,
        resolved: 9,
        total: 1250,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(3)
  })

  it('checks each count against the "+N" it would show', () => {
    /*
     * 3 leaves "+1K", but 4 leaves "+999", which is a character longer. 4 and
     * "+999" take 220, and 3 and "+1K" take 174
     */
    expect(
      fitAvatarCount({
        width: 220,
        resolved: 9,
        total: 1003,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(4)
    expect(
      fitAvatarCount({
        width: 219,
        resolved: 9,
        total: 1003,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(3)
  })

  it('never shows more than fit, even if that means none', () => {
    expect(
      fitAvatarCount({
        width: 60,
        resolved: 9,
        total: 20,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(0)
  })

  it('needs no room for a toggle when there is none', () => {
    // A pair named in full: one avatar, 28 wide
    expect(
      fitAvatarCount({
        width: 28,
        resolved: 1,
        total: 1,
        hasToggle: false,
        formatRemaining,
      }),
    ).toBe(1)
  })
})
