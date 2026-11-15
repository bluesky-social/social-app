import {jsonToLex} from '@atproto/lex'
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister'
import {
  type DehydrateOptions,
  hashKey,
  QueryClient,
} from '@tanstack/react-query'
import {
  type PersistedClient,
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client'

import {isQueryPersisted} from '#/state/queries/util'
import {FALLBACK_MARKER_POST} from '#/features/followingV2/home/api/home'
import {type app} from '#/lexicons'
import {
  FOLLOWING_SNAPSHOT_MAX_BYTES,
  FOLLOWING_SNAPSHOT_QUERY_KEY,
  FOLLOWING_SNAPSHOT_VERSION,
  type FollowingSnapshot,
  isFollowingSnapshotQuery,
  loadFollowingSnapshot,
  readFollowingSnapshot,
  saveFollowingSnapshot,
  selectFollowingSnapshot,
} from './followingSnapshot'
import {type FeedPageUnselected, type PostFeedData} from './postFeed'

// The app-wide mock of `multiformats/cid` can't tell a CID from anything else.
jest.unmock('multiformats/cid')
jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))

const NOW = Date.parse('2026-10-02T12:00:00.000Z')
const POSTED_AT = '2026-10-02T11:00:00.000Z'
const IMAGE_CID = 'bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy'

/**
 * A feed item as the client decodes it from the lex JSON the appview sends,
 * so its image's blob ref is a CID, and it holds some bytes.
 */
function item(
  rkey: string,
  {
    text = rkey,
    createdAt = POSTED_AT,
    indexedAt = POSTED_AT,
    repostedAt,
  }: {
    text?: string
    createdAt?: string
    indexedAt?: string
    /** When it was reposted, for a repost of it. */
    repostedAt?: string
  } = {},
) {
  return jsonToLex({
    ...(repostedAt && {
      reason: {
        $type: 'app.bsky.feed.defs#reasonRepost',
        by: {did: 'did:plc:reposter', handle: 'reposter.test'},
        indexedAt: repostedAt,
      },
    }),
    post: {
      $type: 'app.bsky.feed.defs#postView',
      uri: `at://did:plc:author/app.bsky.feed.post/${rkey}`,
      cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
      author: {did: 'did:plc:author', handle: 'author.test'},
      record: {
        $type: 'app.bsky.feed.post',
        text,
        createdAt,
        embed: {
          $type: 'app.bsky.embed.images',
          images: [
            {
              alt: '',
              image: {
                $type: 'blob',
                ref: {$link: IMAGE_CID},
                mimeType: 'image/jpeg',
                size: 1234,
              },
            },
          ],
        },
        unknownBytes: {$bytes: 'aGVsbG8'},
      },
      indexedAt,
    },
  }) as unknown as app.bsky.feed.defs.FeedViewPost
}

/**
 * Following pages as the query paginates them from the top: each page param
 * is what `getNextPageParam` makes of the page above.
 */
function following(count: number, {text}: {text?: string} = {}): PostFeedData {
  const pages: FeedPageUnselected[] = Array.from({length: count}, (_, i) => ({
    cursor: `c${i}`,
    ...(i === 0 && {startCursor: 'start'}),
    feed: [item(`p${i}`, {text})],
    fetchedAt: NOW,
  }))
  return {
    pages,
    pageParams: pages.map((_, i) =>
      i === 0 ? undefined : {cursor: `c${i - 1}`, source: undefined},
    ),
  }
}

/** The page where Home's Following runs out and carries on into Discover. */
function fallbackPage(): FeedPageUnselected {
  return {
    cursor: 'd0',
    source: 'discover',
    feed: [item('last'), FALLBACK_MARKER_POST, item('discover')],
    fetchedAt: NOW,
  }
}

function cursors(snapshot: FollowingSnapshot | undefined) {
  return snapshot?.pages.map(page => page.cursor)
}

/**
 * A page put above the others with `since`: exhausted, so its cursor echoes
 * `since`, unless it's given another.
 */
function sincePage(
  name: string,
  since: string,
  {
    cursor = since,
    feed = [item(name)],
  }: {cursor?: string; feed?: app.bsky.feed.defs.FeedViewPost[]} = {},
): FeedPageUnselected {
  return {cursor, since, startCursor: `start-${name}`, feed, fetchedAt: NOW}
}

/** `pages` as prepends stack them: each continues from the page above. */
function stacked(pages: FeedPageUnselected[]): PostFeedData {
  return {
    pages,
    pageParams: pages.map((_, i) =>
      i === 0 ? undefined : {cursor: pages[i - 1].cursor!},
    ),
  }
}

function rkeys(page: {feed: unknown[]}) {
  return (page.feed as Array<{post: {uri: string}}>).map(feedItem =>
    feedItem.post.uri.split('/').pop(),
  )
}

/** A valid snapshot as it reads back from disk. */
function savedSnapshot(): FollowingSnapshot {
  return JSON.parse(JSON.stringify(selectFollowingSnapshot(following(2))))
}

describe('selectFollowingSnapshot', () => {
  it('keeps the three newest pages and their page params', () => {
    const snapshot = selectFollowingSnapshot(following(4))

    expect(snapshot?.version).toBe(FOLLOWING_SNAPSHOT_VERSION)
    expect(cursors(snapshot)).toEqual(['c0', 'c1', 'c2'])
    expect(snapshot?.pageParams).toEqual([
      undefined,
      {cursor: 'c0'},
      {cursor: 'c1'},
    ])
  })

  it('drops whole pages from the bottom to stay within 1 MiB', () => {
    const data = following(3, {
      text: 'x'.repeat(Math.floor(FOLLOWING_SNAPSHOT_MAX_BYTES * 0.4)),
    })
    expect(cursors(selectFollowingSnapshot(data))).toEqual(['c0', 'c1'])
  })

  it('saves nothing when the top page alone is over 1 MiB', () => {
    const data = following(2, {
      text: 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES),
    })
    expect(selectFollowingSnapshot(data)).toBeUndefined()
  })

  it('stops before the first Discover page', () => {
    const data = following(2)
    data.pages.push(fallbackPage())
    data.pageParams.push({cursor: 'c1', source: undefined})

    expect(cursors(selectFollowingSnapshot(data))).toEqual(['c0', 'c1'])
  })

  it('saves nothing when the top page has fallen back to Discover', () => {
    expect(
      selectFollowingSnapshot({
        pages: [{...fallbackPage(), startCursor: 'start'}],
        pageParams: [undefined],
      }),
    ).toBeUndefined()
  })

  it('saves nothing without a startCursor on the top page', () => {
    const data = following(2)
    delete data.pages[0].startCursor
    data.pages[1].startCursor = 'lower'
    expect(selectFollowingSnapshot(data)).toBeUndefined()
  })

  it('stops at a page param that does not continue the page above', () => {
    const data = following(3)
    data.pageParams[2] = {cursor: 'elsewhere', source: undefined}
    expect(cursors(selectFollowingSnapshot(data))).toEqual(['c0', 'c1'])

    data.pageParams[1] = {cursor: 'c0', source: 'discover'}
    expect(cursors(selectFollowingSnapshot(data))).toEqual(['c0'])
  })

  it('saves nothing when the data does not start at the top of the feed', () => {
    const data = following(2)
    data.pageParams[0] = {cursor: 'c-1', source: undefined}
    expect(selectFollowingSnapshot(data)).toBeUndefined()
  })

  it('keeps a gapped since page, but nothing below it', () => {
    const below = following(2).pages
    const gapped = sincePage('new', 'start', {cursor: 'gap'})

    expect(
      cursors(selectFollowingSnapshot(stacked([gapped, ...below]))),
    ).toEqual(['gap'])
    expect(
      cursors(
        selectFollowingSnapshot(
          stacked([sincePage('newer', 'start-new'), gapped, ...below]),
        ),
      ),
    ).toEqual(['start-new', 'gap'])
  })

  it('keeps a gapped since page alone once its gap is filled', () => {
    const gapped = sincePage('new', 'start', {cursor: 'gap'})
    const filled = stacked([
      gapped,
      {
        cursor: 'c-gap',
        startCursor: 'start-gap',
        feed: [item('gap')],
        fetchedAt: NOW,
      },
    ])

    const snapshot = selectFollowingSnapshot(filled)

    // Its cursor goes on into what filled the gap.
    expect(cursors(snapshot)).toEqual(['gap'])
    expect(readFollowingSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(
      {pages: [gapped], pageParams: [undefined]},
    )
  })

  it('keeps since pages as they are while the pages below them are kept', () => {
    const data = stacked([sincePage('new', 'start'), ...following(2).pages])

    const snapshot = selectFollowingSnapshot(data)

    expect(snapshot?.pages.map(rkeys)).toEqual([['new'], ['p0'], ['p1']])
    expect(snapshot?.pageParams).toEqual([
      undefined,
      {cursor: 'start'},
      {cursor: 'c0'},
    ])
  })

  it('carries the boundary of the page dropped below an exhausted since page', () => {
    const [top] = following(1).pages
    const boundary = '2026-10-02T10:00:00.000Z'
    top.feed = [
      item('first', {createdAt: boundary, indexedAt: boundary}),
      // Backdated: it sorts by its createdAt, so with the first.
      item('backdated', {createdAt: boundary}),
      item('older', {createdAt: '2026-10-02T09:00:00.000Z'}),
      item('huge', {text: 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES)}),
    ]
    const exhausted = sincePage('new', 'start')
    const data = stacked([exhausted, top])

    const snapshot = selectFollowingSnapshot(data)

    expect(snapshot?.pages.map(rkeys)).toEqual([['new', 'first', 'backdated']])
    expect(snapshot?.pages[0].cursor).toBe('start')
    // Only the copy is changed.
    expect(rkeys(data.pages[0])).toEqual(['new'])
  })

  it('keeps no exhausted since page above a page it does not bound', () => {
    const [top] = following(1).pages
    top.feed.push(
      item('huge', {text: 'x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES)}),
    )
    const data = stacked([
      sincePage('newer', 'start-new'),
      sincePage('new', 'elsewhere'),
      top,
    ])

    // The page below `new` is too big, and `new` can't do without it.
    expect(selectFollowingSnapshot(data)?.pages.map(rkeys)).toEqual([
      ['newer', 'new'],
    ])
  })

  it('carries a run of reposts below a third exhausted since page', () => {
    const [top] = following(1).pages
    const repostedAt = '2026-10-02T10:00:00.000Z'
    top.feed = [
      item('reposted', {createdAt: '2026-09-01T00:00:00.000Z', repostedAt}),
      item('also-reposted', {repostedAt}),
      item('posted', {createdAt: '2026-10-02T09:00:00.000Z'}),
    ]
    const data = stacked([
      sincePage('newest', 'start-newer'),
      sincePage('newer', 'start-new'),
      sincePage('new', 'start'),
      top,
    ])

    const snapshot = selectFollowingSnapshot(data)

    expect(snapshot?.pages.map(rkeys)).toEqual([
      ['newest'],
      ['newer'],
      ['new', 'reposted', 'also-reposted'],
    ])
  })

  it('never changes the live data', () => {
    const data = following(4)
    const {pages} = data
    const before = JSON.stringify(data)

    selectFollowingSnapshot(data)

    expect(data.pages).toBe(pages)
    expect(data.pages).toHaveLength(4)
    expect(JSON.stringify(data)).toBe(before)
  })
})

describe('readFollowingSnapshot', () => {
  it('reads back since pages', () => {
    const data = stacked([
      sincePage('new', 'start'),
      sincePage('older', 'elsewhere', {cursor: 'gap'}),
    ])

    expect(
      readFollowingSnapshot(
        JSON.parse(JSON.stringify(selectFollowingSnapshot(data))),
      )?.pages,
    ).toStrictEqual(data.pages)
  })

  it('round-trips lex values through JSON', () => {
    const data = following(2)

    const restored = readFollowingSnapshot(
      JSON.parse(JSON.stringify(selectFollowingSnapshot(data))),
    )

    expect(restored?.pages).toStrictEqual(data.pages)
    expect(restored?.pageParams).toEqual([undefined, {cursor: 'c0'}])
    const imageRef = (page: FeedPageUnselected) =>
      (
        page.feed[0].post.record as unknown as {
          embed: {images: Array<{image: {ref: unknown}}>}
        }
      ).embed.images[0].image.ref
    expect(Object.getPrototypeOf(imageRef(restored!.pages[0]))).toBe(
      Object.getPrototypeOf(imageRef(data.pages[0])),
    )
    expect(
      (restored!.pages[0].feed[0].post.record as {unknownBytes: unknown})
        .unknownBytes,
    ).toBeInstanceOf(Uint8Array)
  })

  it.each([
    ['nothing', () => undefined],
    ['plain query data', () => following(2)],
    [
      'another version',
      (s: FollowingSnapshot) => ({
        ...s,
        version: FOLLOWING_SNAPSHOT_VERSION + 1,
      }),
    ],
    [
      'misaligned page params',
      (s: FollowingSnapshot) => ({...s, pageParams: [null, {cursor: 'nope'}]}),
    ],
    [
      'fewer page params than pages',
      (s: FollowingSnapshot) => ({...s, pageParams: [null]}),
    ],
    [
      'pages that are not pages',
      (s: FollowingSnapshot) => ({...s, pages: [s.pages[0], {cursor: 1}]}),
    ],
    [
      'no startCursor on the top page',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: s.pages.map(({startCursor: _, ...page}) => page),
      }),
    ],
    [
      'a since that is not a cursor',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: [{...s.pages[0], since: 1}, s.pages[1]],
      }),
    ],
    [
      'a Discover page',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: [s.pages[0], {...s.pages[1], source: 'discover'}],
      }),
    ],
    [
      'more than three pages',
      () =>
        JSON.parse(
          JSON.stringify({
            version: FOLLOWING_SNAPSHOT_VERSION,
            ...following(4),
          }),
        ),
    ],
    [
      'more than 1 MiB',
      (s: FollowingSnapshot) => ({
        ...s,
        pages: [
          s.pages[0],
          {...s.pages[1], feed: ['x'.repeat(FOLLOWING_SNAPSHOT_MAX_BYTES)]},
        ],
      }),
    ],
  ])('rejects %s', (_, tamper: (s: FollowingSnapshot) => unknown) => {
    expect(readFollowingSnapshot(tamper(savedSnapshot()))).toBeUndefined()
  })
})

describe('through the persister', () => {
  type Setup = {
    shouldDehydrateQuery: NonNullable<DehydrateOptions['shouldDehydrateQuery']>
    serialize: (client: PersistedClient) => string
    deserialize: (cached: string) => PersistedClient
  }

  /*
   * The persister as `#/lib/react-query` sets it up, before Following
   * snapshots and with them.
   */
  const today: Setup = {
    shouldDehydrateQuery: query =>
      isQueryPersisted(query.queryKey) && query.state.status === 'success',
    serialize: client => JSON.stringify(client),
    deserialize: cached => JSON.parse(cached),
  }
  function withSnapshots({restore}: {restore?: boolean} = {}): Setup {
    return {
      shouldDehydrateQuery: query =>
        (isQueryPersisted(query.queryKey) || isFollowingSnapshotQuery(query)) &&
        query.state.status === 'success',
      serialize: client => JSON.stringify(saveFollowingSnapshot(client)),
      deserialize: cached =>
        loadFollowingSnapshot(JSON.parse(cached), {restore}),
    }
  }

  const PROFILE_KEY = [
    'profile',
    {did: 'did:plc:viewer'},
    {persistedVersion: 1},
  ]
  /** Today's Home Following, which isn't persisted, and still isn't. */
  const LEGACY_FOLLOWING_KEY = ['post-feed', 'following', {}]

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  function createQueryClient() {
    const queryClient = new QueryClient()
    queryClient.setQueryData(PROFILE_KEY, {handle: 'viewer.test'})
    queryClient.setQueryData(LEGACY_FOLLOWING_KEY, following(2))
    return queryClient
  }

  async function save(
    queryClient: QueryClient,
    {shouldDehydrateQuery, serialize}: Setup,
  ) {
    const store = new Map<string, string>()
    await persistQueryClientSave({
      queryClient,
      persister: createAsyncStoragePersister({
        storage: {
          getItem: key => Promise.resolve(store.get(key) ?? null),
          setItem: (key, value) => {
            store.set(key, value)
            return Promise.resolve()
          },
          removeItem: key => {
            store.delete(key)
            return Promise.resolve()
          },
        },
        serialize,
      }),
      buster: 'test',
      dehydrateOptions: {shouldDehydrateQuery},
    })
    return [...store.values()][0]
  }

  async function restore(cached: string, {deserialize}: Setup) {
    const queryClient = new QueryClient()
    await persistQueryClientRestore({
      queryClient,
      persister: createAsyncStoragePersister({
        storage: {
          getItem: () => Promise.resolve(cached),
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve(),
        },
        deserialize,
      }),
      buster: 'test',
      maxAge: Infinity,
    })
    return queryClient
  }

  function tamperSnapshot(cached: string, tamper: (data: unknown) => unknown) {
    const client: PersistedClient = JSON.parse(cached)
    for (const query of client.clientState.queries) {
      if (query.queryHash === hashKey(FOLLOWING_SNAPSHOT_QUERY_KEY)) {
        query.state.data = tamper(query.state.data)
      }
    }
    return JSON.stringify(client)
  }

  it('writes what it wrote before when there is no Following query', async () => {
    const queryClient = createQueryClient()

    const cached = await save(queryClient, withSnapshots())

    expect(cached).toBe(await save(queryClient, today))
    expect(withSnapshots().deserialize(cached)).toEqual(
      today.deserialize(cached),
    )
  })

  it('writes the Following query as a snapshot and every other query as before', async () => {
    const queryClient = createQueryClient()
    const before: PersistedClient = JSON.parse(await save(queryClient, today))
    const data = following(4)
    queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, data)

    const after: PersistedClient = JSON.parse(
      await save(queryClient, withSnapshots()),
    )

    const snapshot = after.clientState.queries.find(
      query => query.queryHash === hashKey(FOLLOWING_SNAPSHOT_QUERY_KEY),
    )?.state.data as FollowingSnapshot
    expect(snapshot.version).toBe(FOLLOWING_SNAPSHOT_VERSION)
    expect(cursors(snapshot)).toEqual(['c0', 'c1', 'c2'])
    expect(
      after.clientState.queries.filter(
        query => query.queryHash !== hashKey(FOLLOWING_SNAPSHOT_QUERY_KEY),
      ),
    ).toEqual(before.clientState.queries)
    // Selected from a copy: the live cache still has all its pages.
    expect(queryClient.getQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY)).toBe(data)
    expect(data.pages).toHaveLength(4)
  })

  it('leaves the Following query out when none of it can be kept', async () => {
    const queryClient = createQueryClient()
    const data = following(2)
    delete data.pages[0].startCursor
    queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, data)

    expect(await save(queryClient, withSnapshots())).toBe(
      await save(queryClient, today),
    )
  })

  it('hydrates nothing from a valid snapshot while restoring is off', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, following(2))
    const cached = await save(queryClient, withSnapshots())

    const restored = await restore(cached, withSnapshots({restore: false}))

    expect(
      restored.getQueryCache().find({queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY}),
    ).toBeUndefined()
    expect(restored.getQueryData(PROFILE_KEY)).toEqual({handle: 'viewer.test'})
  })

  it('hydrates a valid snapshot, as restoring is on', async () => {
    const queryClient = createQueryClient()
    const data = following(2)
    queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, data)
    const cached = await save(queryClient, withSnapshots())

    const restored = await restore(cached, withSnapshots())

    expect(
      restored.getQueryData<PostFeedData>(FOLLOWING_SNAPSHOT_QUERY_KEY)?.pages,
    ).toStrictEqual(data.pages)
    expect(
      restored.getQueryCache().find({queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY})
        ?.state,
    ).toMatchObject({status: 'success', isInvalidated: false})
  })

  it('drops a snapshot saved while its query was invalidated', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, following(2))
    await queryClient.invalidateQueries({
      queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY,
    })
    const cached = await save(queryClient, withSnapshots())

    const restored = await restore(cached, withSnapshots())

    expect(
      restored.getQueryCache().find({queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY}),
    ).toBeUndefined()
    expect(restored.getQueryData(PROFILE_KEY)).toEqual({handle: 'viewer.test'})
  })

  it.each([
    ['a rejected', (s: unknown) => ({...(s as FollowingSnapshot), version: 0})],
    ['a corrupt', () => 'corrupt'],
    ['a missing', () => undefined],
  ])(
    'drops %s snapshot and hydrates everything else',
    async (_, tamper: (data: unknown) => unknown) => {
      const queryClient = createQueryClient()
      queryClient.setQueryData(FOLLOWING_SNAPSHOT_QUERY_KEY, following(2))
      const cached = tamperSnapshot(
        await save(queryClient, withSnapshots()),
        tamper,
      )

      const restored = await restore(cached, withSnapshots())

      expect(
        restored.getQueryCache().find({queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY}),
      ).toBeUndefined()
      expect(restored.getQueryData(PROFILE_KEY)).toEqual({
        handle: 'viewer.test',
      })
    },
  )
})
