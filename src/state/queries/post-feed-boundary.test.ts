import {FeedTuner} from '#/lib/api/feed-manip'
import {type app} from '#/lexicons'
import {
  type BoundaryPage,
  carryBoundary,
  classifySincePage,
  feedItemKey,
  feedSortTime,
  findFeedGaps,
  gapBelow,
  isContiguousAbove,
  isExhaustedSincePage,
  tuneOrder,
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

describe('classifySincePage', () => {
  /** The restored top page, whose server boundary is `S`. */
  const top: BoundaryPage = {
    cursor: 'T-next',
    startCursor: 'S',
    feed: [item('t0', T2), item('t1', T3), item('t2', T3)],
  }

  function since(
    rkeys: Array<string | app.bsky.feed.defs.FeedViewPost>,
    cursor: string | undefined,
  ) {
    return {
      since: 'S',
      cursor,
      startCursor: 'N',
      feed: rkeys.map(rkey =>
        typeof rkey === 'string' ? item(rkey, T1) : rkey,
      ),
    }
  }

  const rkeys = (page?: BoundaryPage) =>
    page?.feed.map(i => i.post.uri.split('/').pop())

  it('adds nothing for an empty response, however it ends', () => {
    // Exhausted, a refill loop that dropped the echo, or a non-terminal page.
    for (const cursor of ['S', undefined, 'more']) {
      expect(classifySincePage(since([], cursor), top)).toEqual({seam: 'empty'})
    }
  })

  it('is contiguous when the server echoes since back', () => {
    const page = since(['n0', 'n1'], 'S')
    expect(classifySincePage(page, top)).toEqual({seam: 'contiguous', page})
  })

  it('leaves a lone duplicate on a contiguous page to the deduplication', () => {
    // The appview-indexed copy of a post the PDS served in the top page.
    const page = since(['n0', top.feed[0], 'n1'], 'S')
    expect(classifySincePage(page, top)).toEqual({seam: 'contiguous', page})
  })

  it('cuts off the posts the top already holds, from an appview that ignores since', () => {
    const page = since(['n0', 'n1', top.feed[0], top.feed[1]], 'T1-next')

    const {seam, page: added} = classifySincePage(page, top)

    expect(seam).toBe('overlap')
    expect(rkeys(added)).toEqual(['n0', 'n1'])
    // It now ends where the top starts, as a contiguous page does.
    expect(added?.cursor).toBe('S')
    expect(added && isExhaustedSincePage(added)).toBe(true)
    expect(page.feed).toHaveLength(4)
  })

  it('adds nothing when everything it returned is already on top', () => {
    const page = since([top.feed[0], top.feed[1]], 'T1-next')
    expect(classifySincePage(page, top)).toEqual({seam: 'empty'})
  })

  it('finds a gap when the range was not exhausted and it does not reach the top', () => {
    const page = since(['n0', 'n1'], 'more')
    expect(classifySincePage(page, top)).toEqual({seam: 'gap', page})
  })

  it('does not take a lone duplicate in a gapped page for an overlap', () => {
    const page = since(['n0', top.feed[0], 'n1'], 'more')
    expect(classifySincePage(page, top)).toEqual({seam: 'gap', page})
  })

  it('tells a repost from the post it reposts', () => {
    const repost = item('t0', T2, T1)
    expect(feedItemKey(repost)).not.toBe(feedItemKey(top.feed[0]))
    const page = since(['n0', repost], 'more')
    expect(classifySincePage(page, top).seam).toBe('gap')
  })

  it('keeps a page whatever its posts will render as', () => {
    // Moderation happens later, so a page of posts that will all be hidden
    // still carries the newest boundary.
    const page = since(['hidden'], 'S')
    expect(classifySincePage(page, top).page).toBe(page)
  })
})

describe('gapBelow', () => {
  const gapped = {since: 'S', cursor: 'G'}

  it('finds an open gap below a gapped since page', () => {
    // The restored top it was bounded by starts a chain of its own.
    expect(gapBelow(gapped, undefined)).toBe('open')
    // Or a page that continues something else.
    expect(gapBelow(gapped, {cursor: 'elsewhere'})).toBe('open')
  })

  it('finds it filled once the page below continues from its cursor', () => {
    expect(gapBelow(gapped, {cursor: 'G'})).toBe('filled')
  })

  it('finds nothing missing below any other page', () => {
    expect(gapBelow({since: 'S', cursor: 'S'}, undefined)).toBe(undefined)
    expect(gapBelow({cursor: 'C'}, {cursor: 'C'})).toBe(undefined)
    // A page from a chain of its own, as an algorithmic batch would be.
    expect(gapBelow({cursor: 'C'}, undefined)).toBe(undefined)
  })

  it('finds nothing to fill below a since page without a cursor', () => {
    expect(gapBelow({since: 'S', cursor: undefined}, undefined)).toBe(undefined)
  })
})

describe('findFeedGaps', () => {
  const always = () => true

  it('marks the gap below a gapped since page', () => {
    const pages = [
      {since: 'S', cursor: 'G'},
      {cursor: 'r:1', startCursor: 'S'},
      {cursor: 'r:2'},
    ]
    const pageParams = [undefined, undefined, {cursor: 'r:1'}]

    expect(findFeedGaps(pages, pageParams, always)).toEqual(
      new Map([[0, {since: 'S', cursor: 'G', status: 'open'}]]),
    )
  })

  it('marks it filled once the page below continues from it', () => {
    const pages = [{since: 'S', cursor: 'G'}, {cursor: 'G:1'}]

    expect(findFeedGaps(pages, [undefined, {cursor: 'G'}], always)).toEqual(
      new Map([[0, {since: 'S', cursor: 'G', status: 'filled'}]]),
    )
  })

  it('marks nothing where every page continues the one above', () => {
    const contiguous = [{since: 'S', cursor: 'S'}, {cursor: 'r:1'}]
    expect(findFeedGaps(contiguous, [undefined, undefined], always).size).toBe(
      0,
    )
    const ordinary = [{cursor: 'c:1'}, {cursor: 'c:2'}]
    expect(
      findFeedGaps(ordinary, [undefined, {cursor: 'c:1'}], always).size,
    ).toBe(0)
  })

  it('marks nothing between chains that are not since pages', () => {
    // Independently ranked batches, each fetched from the top: their cursors
    // do not join up, but nothing is missing between them.
    const batches = [{cursor: 'b:1'}, {cursor: 'a:1'}, {cursor: 'a:2'}]
    expect(
      findFeedGaps(batches, [undefined, undefined, {cursor: 'a:1'}], always)
        .size,
    ).toBe(0)
  })

  it('collapses adjacent gaps into the upper one', () => {
    const pages = [
      {since: 'S1', cursor: 'G1'},
      // Renders nothing, so its gap would sit right under the one above.
      {since: 'S0', cursor: 'G0'},
      {cursor: 'r:1'},
    ]
    const pageParams = [undefined, undefined, undefined]

    expect(findFeedGaps(pages, pageParams, index => index !== 1)).toEqual(
      new Map([[0, {since: 'S1', cursor: 'G1', status: 'open'}]]),
    )
  })

  it('keeps gaps with rows between them apart', () => {
    const pages = [
      {since: 'S1', cursor: 'G1'},
      {since: 'S0', cursor: 'G0'},
      {cursor: 'r:1'},
    ]

    expect(
      [...findFeedGaps(pages, [undefined, undefined, undefined], always)].map(
        ([index, gap]) => [index, gap.cursor],
      ),
    ).toEqual([
      [0, 'G1'],
      [1, 'G0'],
    ])
  })

  it('marks a gap below a page that renders nothing', () => {
    const pages = [{since: 'S', cursor: 'G'}, {cursor: 'r:1'}]
    expect(findFeedGaps(pages, [undefined, undefined], () => false).size).toBe(
      1,
    )
  })
})

describe('tuneOrder', () => {
  it('tunes pages in the order they were fetched', () => {
    // A page added above the rest was fetched after them.
    expect(
      tuneOrder([{fetchedAt: 30}, {fetchedAt: 10}, {fetchedAt: 20}]),
    ).toEqual([1, 2, 0])
  })

  it('breaks ties towards the top', () => {
    expect(
      tuneOrder([{fetchedAt: 10}, {fetchedAt: 10}, {fetchedAt: 5}]),
    ).toEqual([2, 0, 1])
  })
})
