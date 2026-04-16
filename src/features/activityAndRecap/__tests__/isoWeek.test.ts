import {describe, expect, test} from '@jest/globals'

import {
  currentWeekIso,
  formatWeekIso,
  lastNWeekIsos,
  parseWeekIsoToDate,
  priorWeekIso,
  weekEnd,
  weekStart,
  weekWindowForIso,
} from '#/features/activityAndRecap/reducer/isoWeek'

describe('formatWeekIso', () => {
  test('Wed Apr 15, 2026 → 2026-W16', () => {
    const d = new Date(2026, 3, 15, 12, 0)
    expect(formatWeekIso(d)).toBe('2026-W16')
  })

  test('Sunday 2026-04-19 23:30 local → still 2026-W16', () => {
    const d = new Date(2026, 3, 19, 23, 30)
    expect(formatWeekIso(d)).toBe('2026-W16')
  })

  test('Monday 2026-04-20 00:30 local → 2026-W17', () => {
    const d = new Date(2026, 3, 20, 0, 30)
    expect(formatWeekIso(d)).toBe('2026-W17')
  })
})

describe('weekStart / weekEnd', () => {
  test('week containing Wed 2026-04-15: Mon 2026-04-13 → Sun 2026-04-19', () => {
    const d = new Date(2026, 3, 15, 12, 0)
    const start = weekStart(d)
    const end = weekEnd(d)
    // Mon Apr 13
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(3)
    expect(start.getDate()).toBe(13)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    // Sun Apr 19 23:59:59.999
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(3)
    expect(end.getDate()).toBe(19)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
  })
})

describe('priorWeekIso / currentWeekIso', () => {
  test('priorWeekIso on Wed 2026-04-15 returns 2026-W15', () => {
    expect(priorWeekIso(new Date(2026, 3, 15, 12, 0))).toBe('2026-W15')
  })

  test('currentWeekIso on Wed 2026-04-15 returns 2026-W16', () => {
    expect(currentWeekIso(new Date(2026, 3, 15, 12, 0))).toBe('2026-W16')
  })

  test('Monday 2026-04-20 at 05:59 local → current=W17, prior=W16 (B1 note)', () => {
    // The 06:00 visibility gate is NOT part of week math — just a render gate.
    const monday = new Date(2026, 3, 20, 5, 59)
    expect(currentWeekIso(monday)).toBe('2026-W17')
    expect(priorWeekIso(monday)).toBe('2026-W16')
  })

  test('Sunday 23:59 → current week is still N; Monday 00:00 → N+1', () => {
    const sun = new Date(2026, 3, 19, 23, 59, 59)
    const mon = new Date(2026, 3, 20, 0, 0, 0)
    expect(currentWeekIso(sun)).toBe('2026-W16')
    expect(currentWeekIso(mon)).toBe('2026-W17')
  })
})

describe('lastNWeekIsos', () => {
  test('returns 4 prior ISO week IDs, most recent first', () => {
    const d = new Date(2026, 3, 15, 12, 0) // week 16
    const weeks = lastNWeekIsos(d, 4)
    expect(weeks).toEqual(['2026-W15', '2026-W14', '2026-W13', '2026-W12'])
  })
})

describe('parseWeekIsoToDate / weekWindowForIso', () => {
  test('roundtrips a valid weekIso', () => {
    const d = parseWeekIsoToDate('2026-W15')
    expect(d).not.toBeNull()
    expect(formatWeekIso(d!)).toBe('2026-W15')
  })

  test('returns null for malformed weekIso', () => {
    expect(parseWeekIsoToDate('bogus')).toBeNull()
    expect(parseWeekIsoToDate('2026-W99')).toBeNull()
    expect(weekWindowForIso('garbage')).toBeNull()
  })

  test('weekWindowForIso produces a sensible Mon–Sun window', () => {
    const w = weekWindowForIso('2026-W15')
    expect(w).not.toBeNull()
    expect(w!.start.getDay()).toBe(1) // Monday
    expect(w!.end.getDay()).toBe(0) // Sunday
  })
})
