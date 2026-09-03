import {isStatusStillActive} from '#/features/liveNow/utils'

describe('isStatusStillActive', () => {
  const iso = (offsetMs: number) =>
    new Date(Date.now() + offsetMs).toISOString()

  it('is active for a future expiry', () => {
    expect(isStatusStillActive(iso(60_000))).toBe(true)
  })

  it('is not active for a past expiry', () => {
    expect(isStatusStillActive(iso(-60_000))).toBe(false)
  })

  it('is not active without a value', () => {
    expect(isStatusStillActive(undefined)).toBe(false)
    expect(isStatusStillActive('')).toBe(false)
  })

  /*
   * The predicate reads an atproto `datetime`, which always carries an offset.
   * An unparseable value yields NaN, and every NaN comparison is false, so a
   * bad timestamp reads as "not live" rather than throwing or showing a stale
   * live badge.
   */
  it('is not active for an unparseable value', () => {
    expect(isStatusStillActive('not-a-date')).toBe(false)
  })

  it('handles offsets and fractional seconds', () => {
    const future = new Date(Date.now() + 3_600_000)
    expect(isStatusStillActive(future.toISOString())).toBe(true)
    expect(isStatusStillActive('2000-01-01T00:00:00.123+00:00')).toBe(false)
  })
})
