import {
  getLivestreamDurationSeconds,
  getLivestreamStatus,
  getLivestreamUrl,
} from './streams'
import {isLivestreamRecord, type LivestreamRecord} from './types'

function record(overrides: Partial<LivestreamRecord> = {}): LivestreamRecord {
  return {
    createdAt: '2026-09-11T10:00:00.000Z',
    ...overrides,
  }
}

describe('livestream lifecycle helpers', () => {
  it.each([record(), record({createdAt: '2020-01-01T00:00:00.000Z'})])(
    'treats an absent endedAt as active',
    value => {
      expect(getLivestreamStatus(value)).toBe('active')
      expect(getLivestreamDurationSeconds(value)).toBeUndefined()
    },
  )

  it.each(['', 'not-a-date'])(
    'treats any present endedAt as ended',
    endedAt => {
      const value = record({endedAt})
      expect(getLivestreamStatus(value)).toBe('ended')
      expect(getLivestreamDurationSeconds(value)).toBeUndefined()
    },
  )

  it('calculates whole seconds from ordered raw lifecycle dates', () => {
    expect(
      getLivestreamDurationSeconds(
        record({endedAt: '2026-09-11T10:01:02.999Z'}),
      ),
    ).toBe(62)
  })

  it('accepts equal dates and rejects reversed or invalid dates', () => {
    expect(
      getLivestreamDurationSeconds(
        record({endedAt: '2026-09-11T10:00:00.000Z'}),
      ),
    ).toBe(0)
    expect(
      getLivestreamDurationSeconds(
        record({
          createdAt: '2026-09-11T10:01:00.000Z',
          endedAt: '2026-09-11T10:00:00.000Z',
        }),
      ),
    ).toBeUndefined()
    expect(
      getLivestreamDurationSeconds(
        record({createdAt: 'not-a-date', endedAt: 'also-not-a-date'}),
      ),
    ).toBeUndefined()
  })

  it.each([
    undefined,
    '',
    ' javascript:alert(1) ',
    'ftp://stream.example/live',
    'https://user:password@stream.example/live',
    'not a URL',
    'https:stream.example/live',
    'https:/stream.example/live',
    '//stream.example/live',
  ])('rejects an unavailable or unsafe raw URL %s', url => {
    expect(getLivestreamUrl(record({url}))).toBeUndefined()
  })

  it('returns the trimmed original HTTP(S) URL', () => {
    const value = '  https://stream.example/live?token=abc  '
    expect(getLivestreamUrl(record({url: value}))).toBe(value.trim())
  })

  it('rejects malformed optional fields while accepting invalid date strings', () => {
    expect(isLivestreamRecord(record({endedAt: 'invalid'}))).toBe(true)
    expect(isLivestreamRecord({...record(), title: 42})).toBe(false)
    expect(isLivestreamRecord({...record(), url: {}})).toBe(false)
    expect(isLivestreamRecord({...record(), endedAt: 42})).toBe(false)
    expect(isLivestreamRecord({...record(), $type: 'social.grain.photo'})).toBe(
      false,
    )
    expect(isLivestreamRecord({title: 'Missing creation time'})).toBe(false)
  })
})
