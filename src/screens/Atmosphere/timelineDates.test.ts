import {
  getActivityDateBucket,
  RECENT_ACTIVITY_WINDOW_MS,
} from '#/screens/Atmosphere/timelineDates'

function localDate(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute)
}

function timestamp(date: Date): string {
  return date.toISOString()
}

describe('getActivityDateBucket', () => {
  it('keeps activity at the exact three-hour cutoff recent', () => {
    const now = localDate(2026, 9, 11, 12)
    const atCutoff = new Date(now.getTime() - RECENT_ACTIVITY_WINDOW_MS)
    const justOutside = new Date(atCutoff.getTime() - 1)

    expect(getActivityDateBucket(timestamp(atCutoff), now)).toEqual({
      kind: 'recent',
    })
    expect(getActivityDateBucket(timestamp(justOutside), now)).toEqual({
      kind: 'today',
      key: '2026-09-11',
      date: justOutside,
    })
  })

  it('lets the rolling recent window cross local midnight', () => {
    const now = localDate(2026, 9, 12, 0, 30)
    const recentYesterday = localDate(2026, 9, 11, 23)
    const olderYesterday = localDate(2026, 9, 11, 18)

    expect(getActivityDateBucket(timestamp(recentYesterday), now)).toEqual({
      kind: 'recent',
    })
    expect(getActivityDateBucket(timestamp(olderYesterday), now)).toEqual({
      kind: 'yesterday',
      key: '2026-09-11',
      date: olderYesterday,
    })
  })

  it('uses local calendar boundaries across month and year changes', () => {
    const now = localDate(2025, 1, 1, 12)
    const localYesterday = localDate(2024, 12, 31, 12)
    const older = localDate(2024, 12, 30, 12)

    expect(getActivityDateBucket(timestamp(localYesterday), now)).toEqual({
      kind: 'yesterday',
      key: '2024-12-31',
      date: localYesterday,
    })
    expect(getActivityDateBucket(timestamp(older), now)).toEqual({
      kind: 'older',
      key: '2024-12-30',
      date: older,
    })
  })

  it.each([
    [3, 10, 11, 23],
    [11, 3, 4, 25],
  ])(
    'uses calendar days across the DST transition in month %s',
    (month, previousDay, day, hours) => {
      const now = localDate(2024, month, day, 0, 30)
      const localYesterday = localDate(2024, month, previousDay, 0, 15)
      expect(getActivityDateBucket(timestamp(localYesterday), now)).toEqual({
        kind: 'yesterday',
        key: `2024-${String(month).padStart(2, '0')}-${String(previousDay).padStart(2, '0')}`,
        date: localYesterday,
      })
      if (process.env.TZ === 'America/Chicago') {
        expect(now.getTime() - localYesterday.getTime()).toBe(
          (hours * 60 + 15) * 60_000,
        )
      }
    },
  )

  it('uses the local date even when the serialized timestamp falls on another UTC date', () => {
    const now = localDate(2026, 9, 11, 12)
    const activity = localDate(2026, 9, 11, 0, 15)
    expect(getActivityDateBucket(activity.toISOString(), now)).toEqual({
      kind: 'today',
      key: '2026-09-11',
      date: activity,
    })
    if (process.env.TZ === 'Asia/Tokyo')
      expect(activity.toISOString()).toMatch(/^2026-09-10/)
  })

  it('returns distinct keys for dates with the same day of month', () => {
    const now = localDate(2026, 5, 10, 12)
    const april = localDate(2026, 4, 2, 12)
    const may = localDate(2026, 5, 2, 12)

    expect(getActivityDateBucket(timestamp(april), now)).toEqual({
      kind: 'older',
      key: '2026-04-02',
      date: april,
    })
    expect(getActivityDateBucket(timestamp(may), now)).toEqual({
      kind: 'older',
      key: '2026-05-02',
      date: may,
    })
  })

  it.each([
    '',
    'not-a-date',
    '2026-02-29T12:00:00.000Z',
    '2026-99-99T12:00:00.000Z',
  ])('returns invalid for malformed timestamp %s', value => {
    expect(getActivityDateBucket(value, localDate(2026, 9, 11))).toEqual({
      kind: 'invalid',
    })
  })

  it('keeps future timestamps recent instead of inventing future sections', () => {
    const now = localDate(2026, 9, 11, 12)
    const future = localDate(2026, 9, 12, 12)

    expect(getActivityDateBucket(timestamp(future), now)).toEqual({
      kind: 'recent',
    })
  })

  it('returns the parsed source date and does not mutate either input', () => {
    const now = localDate(2026, 9, 11, 12)
    const source = localDate(2026, 9, 9, 12)
    const originalNow = now.getTime()
    const value = timestamp(source)

    const bucket = getActivityDateBucket(value, now)

    expect(bucket).toEqual({kind: 'older', key: '2026-09-09', date: source})
    expect(now.getTime()).toBe(originalNow)
    expect(value).toBe(timestamp(source))
  })
})
