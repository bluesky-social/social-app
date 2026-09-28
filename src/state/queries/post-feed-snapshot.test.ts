import {Client, jsonToLex} from '@atproto/lex'
import {hashKey, hydrate, QueryClient} from '@tanstack/react-query'
import {
  type PersistedClient,
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client'

import {FALLBACK_MARKER_POST} from '#/lib/api/feed/home'
import {type app} from '#/lexicons'
import {type FeedPageUnselected} from './post-feed'
import {
  FOLLOWING_SNAPSHOT_MAX_BYTES,
  FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS,
  FOLLOWING_SNAPSHOT_QUERY_HASH,
  FOLLOWING_SNAPSHOT_QUERY_KEY,
  FOLLOWING_SNAPSHOT_VERSION,
  type FollowingSnapshot,
  prepareFollowingSnapshotForSave,
  restoreFollowingSnapshot,
  selectFollowingSnapshot,
  utf8ByteLength,
} from './post-feed-snapshot'

// The app-wide mock of `multiformats/cid` cannot tell a CID from anything else.
jest.unmock('multiformats/cid')
jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

const DID = 'did:plc:viewer'
const NOW = Date.parse('2026-09-29T12:00:00.000Z')
const HOUR = 60 * 60 * 1000
const IMAGE_CID = 'bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy'
const POST_CID = 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm'

/**
 * A feed item as the client decodes it, from the lex JSON the appview sends:
 * with an image embed and a quote record, so it holds CIDs, plus some bytes.
 */
function item(
  rkey: string,
  {indexedAt = '2026-09-29T11:00:00.000Z', text = rkey} = {},
): app.bsky.feed.defs.FeedViewPost {
  const author = {did: 'did:plc:author', handle: 'author.test'}
  const quoted = `at://did:plc:quoted/app.bsky.feed.post/${rkey}`
  const image = {
    $type: 'blob',
    ref: {$link: IMAGE_CID},
    mimeType: 'image/jpeg',
    size: 1234,
  }
  return jsonToLex(
    {
      post: {
        $type: 'app.bsky.feed.defs#postView',
        uri: `at://did:plc:author/app.bsky.feed.post/${rkey}`,
        cid: POST_CID,
        author,
        record: {
          $type: 'app.bsky.feed.post',
          text,
          createdAt: indexedAt,
          embed: {
            $type: 'app.bsky.embed.recordWithMedia',
            record: {
              $type: 'app.bsky.embed.record',
              record: {uri: quoted, cid: POST_CID},
            },
            media: {
              $type: 'app.bsky.embed.images',
              images: [{alt: '', image}],
            },
          },
          unknownBytes: {$bytes: 'aGVsbG8'},
        },
        embed: {
          $type: 'app.bsky.embed.recordWithMedia#view',
          record: {
            $type: 'app.bsky.embed.record#view',
            record: {
              $type: 'app.bsky.embed.record#viewRecord',
              uri: quoted,
              cid: POST_CID,
              author,
              value: {
                $type: 'app.bsky.feed.post',
                text: 'quoted',
                createdAt: indexedAt,
                embed: {
                  $type: 'app.bsky.embed.images',
                  images: [{alt: '', image}],
                },
              },
              indexedAt,
            },
          },
          media: {
            $type: 'app.bsky.embed.images#view',
            images: [
              {
                thumb: 'https://cdn.test/thumb.jpg',
                fullsize: 'https://cdn.test/full.jpg',
                alt: '',
              },
            ],
          },
        },
        indexedAt,
        labels: [],
      },
    },
    {strict: false},
  ) as unknown as app.bsky.feed.defs.FeedViewPost
}

function page(
  rkeys: string[],
  fields: Partial<FeedPageUnselected> = {},
): FeedPageUnselected {
  return {
    cursor: undefined,
    feed: rkeys.map(rkey => item(rkey)),
    fetchedAt: NOW - HOUR,
    ...fields,
  }
}

/** Ordinary pagination from the top: each page continues the last cursor. */
function feed(count: number, {startCursor = 'start'} = {}) {
  const pages = Array.from({length: count}, (_, i) =>
    page([`p${i}`], {
      cursor: `c${i}`,
      ...(i === 0 && {startCursor}),
    }),
  )
  return {
    pages,
    pageParams: pages.map((_, i) =>
      i === 0 ? undefined : {cursor: `c${i - 1}`},
    ),
  }
}

function query(queryKey: unknown[], data: unknown) {
  return {
    queryHash: hashKey(queryKey),
    queryKey,
    state: {
      data,
      dataUpdateCount: 1,
      dataUpdatedAt: NOW - HOUR,
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchMeta: null,
      isInvalidated: false,
      status: 'success' as const,
      fetchStatus: 'idle' as const,
    },
  }
}

/** As `useLabelersDetailedInfoQuery` keys them, for `useMyLabelersQuery`. */
function labelersQuery(dids: string[]) {
  return query(['labelers-detailed-info', {dids}, {persistedVersion: 1}], [])
}

const LABELER = 'did:plc:labeler'
// `preferencesQueryKey`.
const preferences = query(['getPreferences', {}, {persistedVersion: 1}], {
  moderationPrefs: {labelers: [{did: LABELER}]},
})
const labelers = labelersQuery(
  Array.from(new Set([...Client.appLabelers, LABELER])),
)
const unrelated = query(['profile', {did: DID}, {persistedVersion: 1}], {
  handle: 'viewer.test',
})

function following(data: unknown) {
  return {
    ...query(FOLLOWING_SNAPSHOT_QUERY_KEY as unknown[], data),
    queryHash: FOLLOWING_SNAPSHOT_QUERY_HASH,
  }
}

function client(queries: object[]): PersistedClient {
  return {
    timestamp: NOW,
    buster: 'test',
    clientState: {mutations: [], queries},
  } as unknown as PersistedClient
}

function select(data: unknown) {
  const result = selectFollowingSnapshot(data, DID, NOW)
  if (!result.ok) {
    throw new Error(`rejected: ${result.reason}`)
  }
  return result.value
}

function rejection(data: unknown) {
  const result = selectFollowingSnapshot(data, DID, NOW)
  return result.ok ? undefined : result.reason
}

/** Saves a client, round-trips it through JSON, and restores it. */
function saveAndRestore(
  queries: object[],
  {isRestoreEnabled = true, now = NOW} = {},
) {
  const saved = prepareFollowingSnapshotForSave(client(queries), {
    did: DID,
    isEligible: () => true,
    now: NOW,
  })
  return restoreFollowingSnapshot(JSON.parse(JSON.stringify(saved)), {
    did: DID,
    isEligible: () => true,
    now,
    isRestoreEnabled,
  })
}

function restoredData(restored: {client: PersistedClient}) {
  return restored.client.clientState.queries.find(
    q => q.queryHash === FOLLOWING_SNAPSHOT_QUERY_HASH,
  )?.state.data as
    {pages: FeedPageUnselected[]; pageParams: unknown[]} | undefined
}

describe('selectFollowingSnapshot', () => {
  it('keeps the three newest pages with their page params', () => {
    const snapshot = select(feed(4))

    expect(snapshot.followingSnapshotVersion).toBe(FOLLOWING_SNAPSHOT_VERSION)
    expect(snapshot.did).toBe(DID)
    expect(snapshot.pages.map(p => p.cursor)).toEqual(['c0', 'c1', 'c2'])
    expect(snapshot.pageParams).toEqual([null, {cursor: 'c0'}, {cursor: 'c1'}])
  })

  it('drops whole pages from the bottom to stay within the byte budget', () => {
    const data = feed(3)
    const text = 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES * 0.4)
    for (const p of data.pages) {
      p.feed = [item(`big-${p.cursor}`, {text})]
    }

    expect(select(data).pages.map(p => p.cursor)).toEqual(['c0', 'c1'])
  })

  it('rejects a snapshot whose top page alone is over the byte budget', () => {
    const data = feed(2)
    data.pages[0].feed = [
      item('huge', {text: 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES)}),
    ]
    expect(rejection(data)).toBe('tooLarge')
  })

  it('rejects pages from a server without startCursor', () => {
    const data = feed(2)
    delete data.pages[0].startCursor
    expect(rejection(data)).toBe('noStartCursor')
  })

  it('rejects what it would keep when only a dropped page had a startCursor', () => {
    const data = feed(2)
    delete data.pages[0].startCursor
    data.pages[1] = {
      ...data.pages[1],
      startCursor: 'lower',
      feed: [item('huge', {text: 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES)})],
    }
    expect(rejection(data)).toBe('noStartCursor')
  })

  it('rejects the Discover fallback at the top and stops before it below', () => {
    const top = feed(3)
    top.pages[0].feed.push(FALLBACK_MARKER_POST)
    expect(rejection(top)).toBe('fallback')

    const lower = feed(3)
    lower.pages[1].feed.push(FALLBACK_MARKER_POST)
    expect(select(lower).pages.map(p => p.cursor)).toEqual(['c0'])
  })

  it('rejects an expired top page and stops before an expired lower one', () => {
    const tooOld = NOW - FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS - 1

    const top = feed(2)
    top.pages[0].fetchedAt = tooOld
    expect(rejection(top)).toBe('expired')

    const lower = feed(3)
    lower.pages[1].fetchedAt = tooOld
    expect(select(lower).pages.map(p => p.cursor)).toEqual(['c0'])
  })

  it('stops at a page that does not continue the one above', () => {
    const data = feed(3)
    data.pageParams[2] = {cursor: 'elsewhere'}
    expect(select(data).pages.map(p => p.cursor)).toEqual(['c0', 'c1'])
  })

  it('stops at a since page that claims to continue a cursor', () => {
    const data = feed(3)
    data.pages[1] = {...data.pages[1], since: 'c0'}
    expect(select(data).pages.map(p => p.cursor)).toEqual(['c0'])
  })

  it('rejects data that does not start at the top of the feed', () => {
    const data = feed(2)
    data.pageParams[0] = {cursor: 'c-1'}
    expect(rejection(data)).toBe('cursor')
  })

  it('rejects data that is not a feed', () => {
    expect(rejection(undefined)).toBe('shape')
    expect(rejection({pages: [], pageParams: []})).toBe('shape')
    expect(rejection({pages: [{}], pageParams: [undefined]})).toBe('shape')
  })

  it('never changes the live data', () => {
    const data = feed(4)
    const before = JSON.stringify(data)
    const pages = data.pages
    select(data)
    expect(data.pages).toBe(pages)
    expect(JSON.stringify(data)).toBe(before)
  })

  describe('boundaries', () => {
    const T = '2026-09-29T10:00:00.000Z'

    /** `since` pages above a page fetched from the top, as prepends leave. */
    function prepended() {
      const sinces = ['s0', 's1', 's2']
      const pages = [
        ...sinces.map((since, i) =>
          page([`new${i}`], {
            since,
            cursor: since,
            startCursor: i === 0 ? 'top' : sinces[i - 1],
          }),
        ),
        {
          ...page([], {cursor: 'old-next', startCursor: 's2'}),
          feed: [
            item('b0', {indexedAt: T}),
            item('b1', {indexedAt: T}),
            item('b2', {indexedAt: '2026-09-29T09:00:00.000Z'}),
          ],
        },
      ]
      return {
        pages,
        pageParams: [...sinces.map(since => ({since})), undefined],
      }
    }

    it('carries the boundary onto an exhausted since page whose page below is dropped', () => {
      const data = prepended()
      const bottom = data.pages[2]

      const snapshot = select(data)

      expect(snapshot.pages).toHaveLength(3)
      expect(snapshot.pageParams).toEqual([
        {since: 's0'},
        {since: 's1'},
        {since: 's2'},
      ])
      expect(
        snapshot.pages[2].feed.map(i =>
          (i as {post: {uri: string}}).post.uri.split('/').pop(),
        ),
      ).toEqual(['new2', 'b0', 'b1'])
      // Only the copy on its way to disk has them.
      expect(bottom.feed).toHaveLength(1)
    })

    it('carries nothing under a gapped since page, which already continues', () => {
      const data = prepended()
      data.pages[0] = {...data.pages[0], cursor: 'gap'}

      const snapshot = select(data)

      expect(snapshot.pages).toHaveLength(1)
      expect(snapshot.pages[0].feed).toHaveLength(1)
    })

    it('drops an exhausted page whose boundary is not directly below it', () => {
      const data = prepended()
      // The page below the second one does not start where its range ends.
      data.pages[2] = {...data.pages[2], startCursor: 'elsewhere'}

      const snapshot = select(data)

      // The first page keeps the boundary of the second instead.
      expect(snapshot.pages).toHaveLength(1)
      expect(
        snapshot.pages[0].feed.map(i =>
          (i as {post: {uri: string}}).post.uri.split('/').pop(),
        ),
      ).toEqual(['new0', 'new1'])
    })

    it('carries nothing from a page too old to keep', () => {
      const data = prepended()
      data.pages[3] = {
        ...data.pages[3],
        fetchedAt: NOW - FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS - 1,
      }

      const snapshot = select(data)

      // The third page cannot take its boundary, so it goes with it.
      expect(snapshot.pages).toHaveLength(2)
      expect(
        snapshot.pages[1].feed.map(i =>
          (i as {post: {uri: string}}).post.uri.split('/').pop(),
        ),
      ).toEqual(['new1', 'new2'])
    })

    it('rejects an exhausted top page whose boundary is not below it', () => {
      const data = prepended()
      data.pages[1] = {...data.pages[1], startCursor: 'elsewhere'}
      data.pages = data.pages.slice(0, 2)
      data.pageParams = data.pageParams.slice(0, 2)
      expect(rejection(data)).toBe('boundary')
    })
  })
})

describe('prepareFollowingSnapshotForSave', () => {
  it('writes the snapshot in place of the Following data and nothing else', () => {
    const data = feed(2)
    const original = client([preferences, following(data), unrelated])

    const saved = prepareFollowingSnapshotForSave(original, {
      did: DID,
      isEligible: () => true,
      now: NOW,
    })

    expect(saved.clientState.queries[0]).toBe(preferences)
    expect(saved.clientState.queries[2]).toBe(unrelated)
    const snapshot = saved.clientState.queries[1].state
      .data as FollowingSnapshot
    expect(snapshot.followingSnapshotVersion).toBe(FOLLOWING_SNAPSHOT_VERSION)
    // The dehydrated client still refers to the live data, untouched.
    expect(original.clientState.queries[1].state.data).toBe(data)
  })

  it('leaves a client with no Following query as it is', () => {
    const isEligible = jest.fn(() => true)
    const original = client([preferences, unrelated])
    expect(
      prepareFollowingSnapshotForSave(original, {did: DID, isEligible}),
    ).toBe(original)
    expect(isEligible).not.toHaveBeenCalled()
  })

  it('leaves the Following query out when Following v2 does not apply', () => {
    const original = client([preferences, following(feed(2)), unrelated])

    for (const options of [
      {did: DID, isEligible: () => false},
      {did: undefined, isEligible: () => true},
    ]) {
      const saved = prepareFollowingSnapshotForSave(original, options)
      expect(JSON.stringify(saved)).toBe(
        JSON.stringify(client([preferences, unrelated])),
      )
    }
  })

  it('leaves it out, and says why, when it cannot be kept', () => {
    const data = feed(2)
    delete data.pages[0].startCursor
    const onRejected = jest.fn()

    const saved = prepareFollowingSnapshotForSave(
      client([preferences, following(data)]),
      {did: DID, isEligible: () => true, now: NOW, onRejected},
    )

    expect(saved.clientState.queries).toEqual([preferences])
    expect(onRejected).toHaveBeenCalledWith('noStartCursor')
  })

  it('never throws', () => {
    const data = feed(1)
    ;(data.pages[0].feed[0] as unknown as {post: object}).post = {
      uri: 'at://x',
      notLex: () => {},
    }
    const onRejected = jest.fn()

    const saved = prepareFollowingSnapshotForSave(
      client([following(data), unrelated]),
      {did: DID, isEligible: () => true, now: NOW, onRejected},
    )

    expect(saved.clientState.queries).toEqual([unrelated])
    expect(onRejected).toHaveBeenCalledWith('error')
  })
})

describe('restoreFollowingSnapshot', () => {
  it('restores posts with image embeds and quote records as they were fetched', () => {
    const data = feed(2)

    const restored = restoreFollowingSnapshot(
      JSON.parse(
        JSON.stringify(
          prepareFollowingSnapshotForSave(
            client([preferences, labelers, following(data)]),
            {did: DID, isEligible: () => true, now: NOW},
          ),
        ),
      ),
      {did: DID, isEligible: () => true, now: NOW, isRestoreEnabled: true},
    )

    expect(restored.report).toMatchObject({outcome: 'restored', pageCount: 2})
    const restoredPages = restoredData(restored)!.pages
    expect(restoredPages).toStrictEqual(data.pages)
    const image = (
      restoredPages[0].feed[0].post.record as unknown as {
        embed: {media: {images: Array<{image: {ref: unknown}}>}}
      }
    ).embed.media.images[0].image.ref
    const live = (
      data.pages[0].feed[0].post.record as unknown as {
        embed: {media: {images: Array<{image: {ref: unknown}}>}}
      }
    ).embed.media.images[0].image.ref
    expect(Object.getPrototypeOf(image)).toBe(Object.getPrototypeOf(live))
    expect(restoredData(restored)!.pageParams).toEqual([
      undefined,
      {cursor: 'c0'},
    ])
  })

  it('drops a valid snapshot while restoring is switched off', () => {
    const restored = saveAndRestore(
      [preferences, labelers, following(feed(2)), unrelated],
      {isRestoreEnabled: false},
    )

    expect(restored.report).toEqual({
      outcome: 'disabled',
      pageCount: 2,
      bytes: expect.any(Number),
      ageMs: HOUR,
      oldestPageAgeMs: HOUR,
    })
    expect(restoredData(restored)).toBeUndefined()
    expect(restored.client.clientState.queries).toHaveLength(3)
  })

  it('rejects a snapshot with a page older than a day', () => {
    const restored = saveAndRestore(
      [preferences, labelers, following(feed(2))],
      {
        now: NOW + FOLLOWING_SNAPSHOT_MAX_PAGE_AGE_MS,
      },
    )
    expect(restored.report).toEqual({outcome: 'rejected', reason: 'expired'})
    expect(restoredData(restored)).toBeUndefined()
  })

  it('rejects a snapshot without the labelers its preferences subscribe to', () => {
    const otherLabelers = labelersQuery([
      ...Client.appLabelers,
      'did:plc:other',
    ])
    expect(
      saveAndRestore([preferences, otherLabelers, following(feed(2))]).report,
    ).toEqual({outcome: 'rejected', reason: 'moderation'})
  })

  it('rejects a snapshot without its moderation inputs', () => {
    expect(saveAndRestore([labelers, following(feed(2))]).report).toEqual({
      outcome: 'rejected',
      reason: 'moderation',
    })
    expect(saveAndRestore([preferences, following(feed(2))]).report).toEqual({
      outcome: 'rejected',
      reason: 'moderation',
    })
  })

  it.each([
    [
      'version',
      (s: FollowingSnapshot) => ({...s, followingSnapshotVersion: 0}),
    ],
    ['account', (s: FollowingSnapshot) => ({...s, did: 'did:plc:other'})],
    ['shape', (s: FollowingSnapshot) => ({...s, pages: 'nope'})],
    [
      'shape',
      (s: FollowingSnapshot) => ({...s, pageParams: s.pageParams.slice(1)}),
    ],
    [
      'cursor',
      (s: FollowingSnapshot) => ({
        ...s,
        pageParams: [null, {cursor: 'elsewhere'}],
      }),
    ],
    [
      'fallback',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: [
          {...s.pages[0], feed: [...s.pages[0].feed, FALLBACK_MARKER_POST]},
          s.pages[1],
        ],
      }),
    ],
    [
      'noStartCursor',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: s.pages.map(({startCursor: _, ...p}) => p),
      }),
    ],
    [
      'tooLarge',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: [
          s.pages[0],
          {
            ...s.pages[1],
            feed: [
              {
                post: {
                  uri: 'x',
                  text: 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES),
                },
              },
            ],
          },
        ],
      }),
    ],
  ])('rejects a snapshot with the wrong %s', (reason, tamper) => {
    const saved = prepareFollowingSnapshotForSave(
      client([preferences, labelers, following(feed(2)), unrelated]),
      {did: DID, isEligible: () => true, now: NOW},
    )
    const parsed: PersistedClient = JSON.parse(JSON.stringify(saved))
    const snapshotQuery = parsed.clientState.queries[2]
    snapshotQuery.state.data = tamper(
      snapshotQuery.state.data as FollowingSnapshot,
    )

    const restored = restoreFollowingSnapshot(parsed, {
      did: DID,
      isEligible: () => true,
      now: NOW,
      isRestoreEnabled: true,
    })

    expect(restored.report).toEqual({outcome: 'rejected', reason})
    expect(restoredData(restored)).toBeUndefined()
    // Everything else is still hydrated.
    expect(restored.client.clientState.queries).toHaveLength(3)
  })

  it('rejects a snapshot once Following v2 no longer applies', () => {
    const saved = JSON.parse(
      JSON.stringify(
        prepareFollowingSnapshotForSave(
          client([preferences, labelers, following(feed(2))]),
          {did: DID, isEligible: () => true, now: NOW},
        ),
      ),
    )
    const restored = restoreFollowingSnapshot(saved, {
      did: DID,
      isEligible: () => false,
      now: NOW,
      isRestoreEnabled: true,
    })
    expect(restored.report).toEqual({outcome: 'rejected', reason: 'ineligible'})
    expect(restoredData(restored)).toBeUndefined()
  })

  it('reports a missing snapshot only when Following v2 applies', () => {
    const noSnapshot = client([preferences])
    expect(
      restoreFollowingSnapshot(noSnapshot, {did: DID, isEligible: () => true})
        .report,
    ).toEqual({outcome: 'absent'})
    expect(
      restoreFollowingSnapshot(noSnapshot, {did: DID, isEligible: () => false})
        .report,
    ).toBeUndefined()
  })

  it('leaves a client it cannot read to TanStack', () => {
    const malformed = {timestamp: NOW, buster: 'test'} as PersistedClient
    expect(
      restoreFollowingSnapshot(malformed, {did: DID, isEligible: () => true})
        .client,
    ).toBe(malformed)
  })

  it('marks the restored query as not invalidated', () => {
    const invalidated = {
      ...following(feed(2)),
      state: {...following(feed(2)).state, isInvalidated: true},
    }
    const restored = saveAndRestore([preferences, labelers, invalidated])
    expect(restored.client.clientState.queries[2].state.isInvalidated).toBe(
      false,
    )
  })
})

describe('through the persister', () => {
  function createStorage() {
    const store = new Map<string, string>()
    return {
      store,
      getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
      setItem: (key: string, value: string) => {
        store.set(key, value)
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        store.delete(key)
        return Promise.resolve()
      },
    }
  }

  function persister(
    storage: ReturnType<typeof createStorage>,
    isRestoreEnabled: boolean,
  ) {
    const options = {did: DID, isEligible: () => true, now: NOW}
    return {
      persistClient: async (persisted: PersistedClient) => {
        await storage.setItem(
          'cache',
          JSON.stringify(prepareFollowingSnapshotForSave(persisted, options)),
        )
      },
      restoreClient: async () => {
        const cached = await storage.getItem('cache')
        return cached
          ? restoreFollowingSnapshot(JSON.parse(cached), {
              ...options,
              isRestoreEnabled,
            }).client
          : undefined
      },
      removeClient: async () => {
        await storage.removeItem('cache')
      },
    }
  }

  async function saveFrom(data: unknown) {
    const storage = createStorage()
    const queryClient = new QueryClient()
    hydrate(queryClient, client([preferences, labelers, unrelated]).clientState)
    queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, data)
    await persistQueryClientSave({
      queryClient,
      persister: persister(storage, true),
      buster: 'test',
      dehydrateOptions: {shouldDehydrateQuery: () => true},
    })
    return {storage, queryClient}
  }

  async function restoreInto(
    storage: ReturnType<typeof createStorage>,
    isRestoreEnabled = true,
  ) {
    const queryClient = new QueryClient()
    await persistQueryClientRestore({
      queryClient,
      persister: persister(storage, isRestoreEnabled),
      buster: 'test',
      maxAge: Infinity,
    })
    return queryClient
  }

  it('hydrates a restored snapshot into the Following query', async () => {
    const data = feed(2)
    const {storage} = await saveFrom(data)

    const queryClient = await restoreInto(storage)

    expect(
      queryClient.getQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY),
    ).toStrictEqual(data)
    expect(queryClient.getQueryData(unrelated.queryKey)).toEqual(
      unrelated.state.data,
    )
  })

  it('cold-loads Following from a rejected snapshot and hydrates everything else', async () => {
    const data = feed(2)
    const {storage} = await saveFrom(data)
    const cached: PersistedClient = JSON.parse(storage.store.get('cache')!)
    const snapshot = cached.clientState.queries.find(
      q => q.queryHash === FOLLOWING_SNAPSHOT_QUERY_HASH,
    )!.state.data as FollowingSnapshot
    snapshot.did = 'did:plc:other'
    storage.store.set('cache', JSON.stringify(cached))

    const queryClient = await restoreInto(storage)

    expect(
      queryClient
        .getQueryCache()
        .find({queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY}),
    ).toBeUndefined()
    expect(queryClient.getQueryData(unrelated.queryKey)).toEqual(
      unrelated.state.data,
    )
    expect(queryClient.getQueryData(preferences.queryKey)).toEqual(
      preferences.state.data,
    )
  })

  it('leaves Following to cold-load while restoring is switched off', async () => {
    const {storage} = await saveFrom(feed(2))
    const queryClient = await restoreInto(storage, false)
    expect(
      queryClient
        .getQueryCache()
        .find({queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY}),
    ).toBeUndefined()
    expect(queryClient.getQueryData(unrelated.queryKey)).toEqual(
      unrelated.state.data,
    )
  })

  it('does not change the live cache when it saves', async () => {
    const data = feed(4)
    const {queryClient} = await saveFrom(data)
    expect(queryClient.getQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY)).toBe(data)
    expect(data.pages).toHaveLength(4)
  })
})

describe('utf8ByteLength', () => {
  it('counts the bytes each character takes in UTF-8', () => {
    expect(utf8ByteLength('abc')).toBe(3)
    expect(utf8ByteLength('é')).toBe(2)
    expect(utf8ByteLength('日本')).toBe(6)
    expect(utf8ByteLength('🦋')).toBe(4)
    expect(utf8ByteLength('a🦋é')).toBe(7)
  })
})
