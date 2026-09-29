import {FeedTuner} from '#/lib/api/feed-manip'
import {type app} from '#/lexicons'
import {
  type BoundaryPage,
  carryBoundary,
  feedSortTime,
  isContiguousAbove,
  isExhaustedSincePage,
} from './post-feed-boundary'

function item(
  rkey: string,
  indexedAt: string,
  repostedAt?: string,
): app.bsky.feed.defs.FeedViewPost {
  return {
    post: {
      $type: 'app.bsky.feed.defs#postView',
      uri: `at://did:plc:author/app.bsky.feed.post/${rkey}`,
      cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
      author: {did: 'did:plc:author', handle: 'author.test'},
      record: {
        $type: 'app.bsky.feed.post',
        text: rkey,
        createdAt: indexedAt,
      },
      indexedAt,
    },
    ...(repostedAt && {
      reason: {
        $type: 'app.bsky.feed.defs#reasonRepost',
        by: {did: 'did:plc:reposter', handle: 'reposter.test'},
        indexedAt: repostedAt,
      },
    }),
  } as unknown as app.bsky.feed.defs.FeedViewPost
}

/** A post whose record's `createdAt` differs from when it was indexed. */
function dated(rkey: string, createdAt: unknown, indexedAt: string) {
  const post = item(rkey, indexedAt)
  return {
    ...post,
    post: {...post.post, record: {...post.post.record, createdAt}},
  } as app.bsky.feed.defs.FeedViewPost
}

const T1 = '2026-09-28T12:00:03.000Z'
const T2 = '2026-09-28T12:00:02.000Z'
const T3 = '2026-09-28T12:00:01.000Z'

/** A `since` page whose range down to `S` came back whole. */
const exhausted: BoundaryPage = {
  since: 'S',
  cursor: 'S',
  startCursor: 'P',
  feed: [item('new', T1)],
}

/** The page it was bounded by, which starts at `S`. */
function lowerPage(feed: app.bsky.feed.defs.FeedViewPost[]): BoundaryPage {
  return {cursor: 'Q', startCursor: 'S', feed}
}

describe('carryBoundary', () => {
  it('carries the first post and every post after it with the same sort time', () => {
    const lower = lowerPage([
      item('a', T2),
      item('b', T3, T2),
      item('c', T2),
      item('d', T3),
      item('e', T2),
    ])

    const carried = carryBoundary(exhausted, lower)

    expect(carried.feed.map(i => i.post.record.text)).toEqual([
      'new',
      'a',
      'b',
      'c',
    ])
    expect(carried.cursor).toBe('S')
  })

  it('finds the posts sharing the boundary by createdAt, which sorts before indexing', () => {
    // Created in the same millisecond, but indexed at different times.
    const lower = lowerPage([
      dated('a', T2, '2026-09-28T12:00:03.104Z'),
      dated('b', T2, '2026-09-28T12:00:02.284Z'),
      dated('c', T3, '2026-09-28T12:00:02.284Z'),
    ])

    const carried = carryBoundary(exhausted, lower)

    expect(carried.feed.map(i => i.post.record.text)).toEqual(['new', 'a', 'b'])
  })

  it('carries a run of reposts indexed in the same millisecond', () => {
    const lower = lowerPage([
      item('a', T3, T2),
      item('b', T1, T2),
      item('c', T2),
      item('d', T3, T3),
    ])

    const carried = carryBoundary(exhausted, lower)

    expect(carried.feed.map(i => i.post.record.text)).toEqual([
      'new',
      'a',
      'b',
      'c',
    ])
  })

  it('compares sort times, not how they are written', () => {
    const lower = lowerPage([
      item('a', '2026-09-28T12:00:02.000Z'),
      item('b', '2026-09-28T12:00:02Z'),
      item('c', '2026-09-28T14:00:02.000+02:00'),
      item('d', T3),
    ])

    const carried = carryBoundary(exhausted, lower)

    expect(carried.feed.map(i => i.post.record.text)).toEqual([
      'new',
      'a',
      'b',
      'c',
    ])
  })

  it('carries only the first post when the next one sorts earlier', () => {
    const carried = carryBoundary(
      exhausted,
      lowerPage([item('a', T2), item('b', T3)]),
    )
    expect(carried.feed.map(i => i.post.record.text)).toEqual(['new', 'a'])
  })

  it('never mutates either page', () => {
    const lower = lowerPage([item('a', T2)])
    const upperFeed = exhausted.feed
    carryBoundary(exhausted, lower)
    expect(exhausted.feed).toBe(upperFeed)
    expect(exhausted.feed).toHaveLength(1)
    expect(lower.feed).toHaveLength(1)
  })

  it('carries nothing onto a gapped since page, which already continues', () => {
    const gapped: BoundaryPage = {...exhausted, cursor: 'G'}
    expect(carryBoundary(gapped, lowerPage([item('a', T2)]))).toBe(gapped)
  })

  it('carries nothing from a page it does not bound', () => {
    const other: BoundaryPage = {
      cursor: 'Q',
      startCursor: 'X',
      feed: [item('a', T2)],
    }
    expect(carryBoundary(exhausted, other)).toBe(exhausted)
  })

  it('carries nothing from an empty page', () => {
    expect(carryBoundary(exhausted, lowerPage([]))).toBe(exhausted)
  })

  it('leaves a duplicate of a boundary post to the feed deduplication', () => {
    const boundary = item('a', T2)
    // The upper page already holds the boundary post, never shown below it.
    const upper: BoundaryPage = {
      ...exhausted,
      feed: [item('new', T1), boundary],
    }

    const carried = carryBoundary(upper, lowerPage([boundary]))

    expect(carried.feed).toHaveLength(3)
    const rendered = new FeedTuner([])
      .tune(carried.feed)
      .flatMap(slice => slice.items.map(i => i.post.uri))
    expect(rendered).toEqual([
      'at://did:plc:author/app.bsky.feed.post/new',
      'at://did:plc:author/app.bsky.feed.post/a',
    ])
  })
})

describe('boundary helpers', () => {
  it('recognizes an exhausted since page by its echoed cursor', () => {
    expect(isExhaustedSincePage(exhausted)).toBe(true)
    expect(isExhaustedSincePage({...exhausted, cursor: 'G'})).toBe(false)
    expect(isExhaustedSincePage({cursor: 'S', feed: []})).toBe(false)
  })

  it('treats a page as directly below only where the since bound starts it', () => {
    expect(isContiguousAbove(exhausted, lowerPage([]))).toBe(true)
    expect(
      isContiguousAbove(exhausted, {cursor: 'Q', startCursor: 'X', feed: []}),
    ).toBe(false)
    expect(isContiguousAbove(exhausted, {cursor: 'Q', feed: []})).toBe(false)
  })
})

describe('feedSortTime', () => {
  it('sorts a post by the earlier of its createdAt and its indexedAt', () => {
    expect(feedSortTime(dated('a', T2, T1))).toBe(Date.parse(T2))
    expect(feedSortTime(dated('a', T1, T2))).toBe(Date.parse(T2))
    expect(feedSortTime(item('a', T3))).toBe(Date.parse(T3))
  })

  it('sorts a backdated post by when it says it was created', () => {
    const createdAt = '2019-01-01T00:00:00.000Z'
    expect(feedSortTime(dated('a', createdAt, T1))).toBe(Date.parse(createdAt))
  })

  it('sorts a post by its indexedAt when its createdAt is not a date', () => {
    for (const createdAt of ['not a date', '', 42, undefined]) {
      expect(feedSortTime(dated('a', createdAt, T1))).toBe(Date.parse(T1))
    }
  })

  it('sorts a repost by when it was indexed, whenever the post was made', () => {
    expect(feedSortTime(item('a', T3, T1))).toBe(Date.parse(T1))
    const repost = {...dated('a', T3, T3), reason: item('b', T3, T1).reason}
    expect(feedSortTime(repost)).toBe(Date.parse(T1))
  })
})
