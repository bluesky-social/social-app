import {describe, expect, test} from '@jest/globals'

import {followerDelta} from '#/features/activityAndRecap/reducer/followerDelta'

describe('followerDelta', () => {
  test('basic positive delta', () => {
    const snaps = [
      {day: '2026-04-13', count: 100},
      {day: '2026-04-19', count: 107},
    ]
    expect(followerDelta(snaps, '2026-04-13', '2026-04-19')).toBe(7)
  })

  test('clamps negative delta to 0 (B4)', () => {
    const snaps = [
      {day: '2026-04-13', count: 120},
      {day: '2026-04-19', count: 100},
    ]
    expect(followerDelta(snaps, '2026-04-13', '2026-04-19')).toBe(0)
  })

  test('missing start snapshot degrades to oldest available without throwing (B4, R2)', () => {
    const snaps = [
      {day: '2026-04-15', count: 90}, // oldest, will back-fill the start
      {day: '2026-04-19', count: 95},
    ]
    expect(followerDelta(snaps, '2026-04-13', '2026-04-19')).toBe(5)
  })

  test('zero snapshots → 0', () => {
    expect(followerDelta([], '2026-04-13', '2026-04-19')).toBe(0)
  })

  test('undefined snapshots → 0', () => {
    expect(followerDelta(undefined, '2026-04-13', '2026-04-19')).toBe(0)
  })

  test('uses latest snapshot <= endDay for end (not a snapshot after the window)', () => {
    const snaps = [
      {day: '2026-04-13', count: 100},
      {day: '2026-04-16', count: 105},
      {day: '2026-04-25', count: 200}, // outside window
    ]
    expect(followerDelta(snaps, '2026-04-13', '2026-04-19')).toBe(5)
  })

  test('snapshots that land inside the window are usable as end', () => {
    const snaps = [
      {day: '2026-04-10', count: 80},
      {day: '2026-04-15', count: 85},
    ]
    expect(followerDelta(snaps, '2026-04-13', '2026-04-19')).toBe(5)
  })
})
