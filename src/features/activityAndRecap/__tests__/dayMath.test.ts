import {describe, expect, test} from '@jest/globals'

import {
  daysBetweenLocalDays,
  formatLocalDay,
  parseLocalDay,
} from '#/features/activityAndRecap/reducer/dayMath'

describe('formatLocalDay', () => {
  test('returns YYYY-MM-DD for UTC tz', () => {
    const d = new Date('2026-04-15T12:00:00Z')
    expect(formatLocalDay(d, 'UTC')).toBe('2026-04-15')
  })

  test('rolls back a day when crossing tz westward (EWR vs LAX near midnight UTC)', () => {
    // 02:30 UTC Thursday → 22:30 Wednesday in America/New_York
    //                  → 19:30 Wednesday in America/Los_Angeles
    const d = new Date('2026-04-16T02:30:00Z')
    expect(formatLocalDay(d, 'America/New_York')).toBe('2026-04-15')
    expect(formatLocalDay(d, 'America/Los_Angeles')).toBe('2026-04-15')
  })

  test('handles DST spring-forward (America/New_York, 2026-03-08)', () => {
    // DST starts at 07:00 UTC on 2026-03-08. 09:00 UTC is 05:00 EDT.
    const d = new Date('2026-03-08T09:00:00Z')
    expect(formatLocalDay(d, 'America/New_York')).toBe('2026-03-08')
  })

  test('handles DST fall-back (America/New_York, 2026-11-01)', () => {
    // 03:30 UTC on 2026-11-01 is 23:30 EDT on 2026-10-31 (still Oct 31).
    const d = new Date('2026-11-01T03:30:00Z')
    expect(formatLocalDay(d, 'America/New_York')).toBe('2026-10-31')
  })
})

describe('parseLocalDay', () => {
  test('parses a valid date', () => {
    expect(parseLocalDay('2026-04-15')).toEqual({
      year: 2026,
      month: 4,
      day: 15,
    })
  })

  test('returns null for malformed', () => {
    expect(parseLocalDay('not a date')).toBeNull()
    expect(parseLocalDay('2026-4-15')).toBeNull()
    expect(parseLocalDay('2026/04/15')).toBeNull()
  })
})

describe('daysBetweenLocalDays', () => {
  test('same day → 0', () => {
    expect(daysBetweenLocalDays('2026-04-15', '2026-04-15')).toBe(0)
  })

  test('consecutive days → 1', () => {
    expect(daysBetweenLocalDays('2026-04-15', '2026-04-16')).toBe(1)
  })

  test('two-day gap → 2', () => {
    expect(daysBetweenLocalDays('2026-04-15', '2026-04-17')).toBe(2)
  })

  test('negative delta on regression → -1', () => {
    expect(daysBetweenLocalDays('2026-04-16', '2026-04-15')).toBe(-1)
  })

  test('month boundary crossing', () => {
    expect(daysBetweenLocalDays('2026-03-31', '2026-04-01')).toBe(1)
  })

  test('DST spring-forward does not affect day count', () => {
    // 2026-03-07 → 2026-03-09 (DST starts 2026-03-08) is still 2 days
    expect(daysBetweenLocalDays('2026-03-07', '2026-03-09')).toBe(2)
  })

  test('null for malformed input', () => {
    expect(daysBetweenLocalDays('bad', '2026-04-15')).toBeNull()
    expect(daysBetweenLocalDays('2026-04-15', 'bad')).toBeNull()
  })
})
