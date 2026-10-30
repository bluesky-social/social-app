import {type app} from '#/lexicons'
import {
  getLivestreamDurationSeconds,
  getLivestreamStatus,
  getLivestreamUrl,
} from './streams'
import {createLivestreamView} from './testFixtures'

describe('livestream lifecycle helpers', () => {
  it.each([true, false])(
    'uses active=%s regardless of absent endedAt or stale creation',
    active => {
      const view = createLivestreamView({
        active,
        createdAt: '2020-01-01T00:00:00.000Z',
        endedAt: undefined,
      })
      expect(getLivestreamStatus(view)).toBe(active ? 'active' : 'ended')
      expect(getLivestreamDurationSeconds(view)).toBeUndefined()
    },
  )

  it('uses the actual startedAt before createdAt and floors whole seconds', () => {
    const view = createLivestreamView({
      active: false,
      endedAt: '2026-09-10T11:01:02.999Z',
    })
    expect(getLivestreamDurationSeconds(view)).toBe(62)
    expect(getLivestreamDurationSeconds({...view, startedAt: undefined})).toBe(
      3662,
    )
    expect(
      getLivestreamDurationSeconds({
        ...view,
        startedAt: undefined,
        createdAt: undefined,
      }),
    ).toBeUndefined()
    expect(
      getLivestreamDurationSeconds({
        ...view,
        startedAt:
          'invalid' as app.bsky.embed.external.ViewLivestream['startedAt'],
      }),
    ).toBeUndefined()
  })

  it.each([
    ['2026-09-10T11:00:00.000Z', 0],
    ['2026-09-10T10:59:59.000Z', undefined],
    ['not-a-date', undefined],
    ['', undefined],
  ] as const)(
    'handles endedAt=%s without manufacturing a duration',
    (endedAt, expected) => {
      expect(
        getLivestreamDurationSeconds(
          createLivestreamView({
            endedAt:
              endedAt as app.bsky.embed.external.ViewLivestream['endedAt'],
          }),
        ),
      ).toBe(expected)
    },
  )

  it.each([
    '',
    ' javascript:alert(1) ',
    'ftp://stream.example/live',
    'https://user:password@stream.example/live',
    'not a URL',
    'https:stream.example/live',
    'https:/stream.example/live',
    '//stream.example/live',
  ])('rejects unsafe supplied URI %s', uri => {
    expect(
      getLivestreamUrl(
        createLivestreamView({
          uri: uri as app.bsky.embed.external.ViewLivestream['uri'],
        }),
      ),
    ).toBeUndefined()
  })

  it.each([
    'https://stream.example/live?token=abc',
    'http://stream.example/live',
  ])('returns the trimmed supplied HTTP(S) link %s', uri => {
    expect(
      getLivestreamUrl(
        createLivestreamView({
          uri: ` ${uri} ` as app.bsky.embed.external.ViewLivestream['uri'],
        }),
      ),
    ).toBe(uri)
  })
})
