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
 * Each avatar takes 36 (28 and a gap of 8). The toggle's left padding
 * overlaps the last gap, so it takes 24 with just the chevron. With a "+N" it
 * takes 28 and 10 for each character of the "+N", e.g. 58 for "+17" and 78
 * for "+1.2K".
 */
describe('fitAvatarCount', () => {
  it('shows everyone, without a "+N", when they all fit', () => {
    // 6 * 36 + 24 = 240
    expect(
      fitAvatarCount({
        width: 240,
        resolved: 6,
        total: 6,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(6)
  })

  it('makes room for the "+N" once everyone no longer fits', () => {
    // 239 is too narrow for all 6 and the chevron. 5 and "+1" take 228
    expect(
      fitAvatarCount({
        width: 239,
        resolved: 6,
        total: 6,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(5)
    // 227 is too narrow for that, and 4 and "+2" take 192
    expect(
      fitAvatarCount({
        width: 227,
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
    // 2 and "+18" take 130, a phone row beside a thumbnail
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
    // 4 and "+16" take 202
    expect(
      fitAvatarCount({
        width: 220,
        resolved: 9,
        total: 20,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(4)
    // 4 and "+1.2K" take 222, but 3 and "+1.2K" take 186
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
     * "+999" take 212, and 3 and "+1K" take 166
     */
    expect(
      fitAvatarCount({
        width: 212,
        resolved: 9,
        total: 1003,
        hasToggle: true,
        formatRemaining,
      }),
    ).toBe(4)
    expect(
      fitAvatarCount({
        width: 211,
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
