import {type FeedPostSlice} from '#/state/queries/post-feed'
import {FOLLOWING_SNAPSHOT_QUERY_KEY} from '#/state/queries/post-feed-snapshot'
import {type AnalyticsContextType} from '#/analytics'
import {
  feedGapRows,
  gapRowStatusAfterFill,
  isFeedSliceHidden,
  isGapRowInView,
} from './feedGapRows'

const ax = {
  features: {
    FollowingV2Enable: 'following_v2:enable',
    enabled: () => true,
  },
} as unknown as Pick<AnalyticsContextType, 'features'>

const FOR_YOU_KEY = [
  'post-feed',
  'feedgen|at://did:plc:3guzzweuqraryl3rdkimjamk/app.bsky.feed.generator/for-you',
  {},
]

function slice(did: string): FeedPostSlice {
  return {
    _isFeedPostSlice: true,
    _reactKey: `slice-${did}`,
    items: [{post: {author: {did}}}],
    isIncompleteThread: false,
    isFallbackMarker: false,
    feedContext: undefined,
    reqId: undefined,
    feedPostUri: `at://${did}/app.bsky.feed.post/post`,
  } as unknown as FeedPostSlice
}

/** Two pages fetched with `since` above a restored top, neither reaching it. */
function gappedPages(upperAuthor = 'did:plc:upper') {
  return {
    pages: [
      {since: 'S1', cursor: 'G1', slices: [slice(upperAuthor)]},
      {since: 'S0', cursor: 'G0', slices: [slice('did:plc:lower')]},
      {cursor: 'r:1', slices: [slice('did:plc:restored')]},
    ],
    pageParams: [undefined, undefined, undefined],
  }
}

describe('feedGapRows', () => {
  it('marks the gaps in restored Following', () => {
    const {pages, pageParams} = gappedPages()

    const rows = feedGapRows({
      ax,
      queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY,
      pages,
      pageParams,
      blockedOrMutedAuthors: [],
    })

    expect([...rows.keys()]).toEqual([0, 1])
    expect(rows.get(0)).toEqual({
      type: 'followingGap',
      key: 'followingGap-S1-G1',
      gap: {since: 'S1', cursor: 'G1', status: 'open'},
    })
  })

  it('never marks gaps in another feed, whatever its pages look like', () => {
    const {pages, pageParams} = gappedPages()
    expect(
      feedGapRows({
        ax,
        queryKey: FOR_YOU_KEY,
        pages,
        pageParams,
        blockedOrMutedAuthors: [],
      }).size,
    ).toBe(0)
  })

  it('collapses gaps with only muted posts between them', () => {
    const {pages, pageParams} = gappedPages()

    const rows = feedGapRows({
      ax,
      queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY,
      pages,
      pageParams,
      // Everything on the page between the two gaps is by this author.
      blockedOrMutedAuthors: ['did:plc:lower'],
    })

    expect([...rows.keys()]).toEqual([0])
  })

  it('keeps the key of a gap once it is filled', () => {
    const pages = [
      {since: 'S', cursor: 'G', slices: [slice('did:plc:upper')]},
      {cursor: 'G:1', slices: [slice('did:plc:lower')]},
    ]
    const rowsFor = (pageParams: unknown[]) =>
      feedGapRows({
        ax,
        queryKey: FOLLOWING_SNAPSHOT_QUERY_KEY,
        pages,
        pageParams,
        blockedOrMutedAuthors: [],
      }).get(0)

    const open = rowsFor([undefined, undefined])
    const filled = rowsFor([undefined, {cursor: 'G'}])

    expect(open?.gap.status).toBe('open')
    expect(filled?.gap.status).toBe('filled')
    expect(filled?.key).toBe(open?.key)
  })
})

describe('isFeedSliceHidden', () => {
  it('hides a slice by a blocked or muted author', () => {
    expect(isFeedSliceHidden(slice('did:plc:a'), ['did:plc:a'])).toBe(true)
    expect(isFeedSliceHidden(slice('did:plc:a'), ['did:plc:b'])).toBe(false)
  })

  it('never hides the fallback marker', () => {
    const marker = {...slice('did:fake'), isFallbackMarker: true}
    expect(isFeedSliceHidden(marker, ['did:fake'])).toBe(false)
  })
})

describe('isGapRowInView', () => {
  const listTop = 0
  const headerOffset = 100

  it('is in view anywhere below the header', () => {
    expect(
      isGapRowInView({row: {y: 300, height: 50}, listTop, headerOffset}),
    ).toBe(true)
    // Scrolled back up past it, so that it is below the screen.
    expect(
      isGapRowInView({row: {y: 5000, height: 50}, listTop, headerOffset}),
    ).toBe(true)
    // Partly under the header.
    expect(
      isGapRowInView({row: {y: 80, height: 50}, listTop, headerOffset}),
    ).toBe(true)
  })

  it('is out of view once scrolled up under the header or off the list', () => {
    expect(
      isGapRowInView({row: {y: 40, height: 50}, listTop, headerOffset}),
    ).toBe(false)
    expect(
      isGapRowInView({row: {y: -400, height: 50}, listTop, headerOffset}),
    ).toBe(false)
  })

  it('stays in view where it was pressed, with the header scrolled away', () => {
    // Pressed at the top of the screen, with no header over it.
    const pressedTop = 20
    expect(
      isGapRowInView({
        row: {y: 20, height: 50},
        listTop,
        headerOffset,
        pressedTop,
      }),
    ).toBe(true)
    expect(
      isGapRowInView({
        row: {y: -40, height: 50},
        listTop,
        headerOffset,
        pressedTop,
      }),
    ).toBe(false)
  })

  it('is never in view above the top of the list', () => {
    expect(
      isGapRowInView({
        row: {y: -60, height: 50},
        listTop,
        headerOffset,
        pressedTop: -60,
      }),
    ).toBe(false)
  })

  it('is out of view when it cannot be measured', () => {
    expect(isGapRowInView({row: undefined, listTop, headerOffset})).toBe(false)
    expect(
      isGapRowInView({
        row: {y: 300, height: 50},
        listTop: undefined,
        headerOffset,
      }),
    ).toBe(false)
  })
})

describe('gapRowStatusAfterFill', () => {
  it('keeps loading once the gap is filled, until the row empties or goes', () => {
    expect(gapRowStatusAfterFill({outcome: 'filled', itemCount: 30})).toBe(
      'filling',
    )
    // Even when the page that fills it renders nothing.
    expect(gapRowStatusAfterFill({outcome: 'filled', itemCount: 0})).toBe(
      'filling',
    )
  })

  it('offers to try again after a failed fill', () => {
    expect(gapRowStatusAfterFill({outcome: 'failed'})).toBe('failed')
  })

  it('is ready to be pressed again when the fill wrote nothing', () => {
    expect(gapRowStatusAfterFill({outcome: 'superseded'})).toBe('idle')
  })
})
