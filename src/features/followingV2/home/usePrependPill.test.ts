import {act, renderHook} from '@testing-library/react-native'

import {newPostsPillPresentation} from '#/components/NewPostsPill/presentation'
import {type FeedPostSlice} from './queries/postFeed'
import {
  getPrependOffer,
  livePrependOffer,
  usePrependPill,
} from './usePrependPill'

// Only its constant: its hooks need queries this doesn't set up.
jest.mock('./useSettleAtTop', () => ({SETTLE_AT_TOP_LIMIT: 5}))

const RESTORED_AT = 1000
const PREPENDED_AT = 2000
const LATER_AT = 3000

/**
 * A feed item by `did`, whose own post is the last of `context` posts before
 * it in its thread.
 */
function slice(
  rkey: string,
  {
    did = `did:plc:${rkey}`,
    avatar = `https://cdn.test/${rkey}.jpg`,
    blur = false,
    filter = false,
    context = 0,
  }: {
    did?: string
    avatar?: string
    blur?: boolean
    filter?: boolean
    context?: number
  } = {},
): FeedPostSlice {
  const uris = [
    ...Array.from(
      {length: context},
      (_, i) => `at://did:plc:context/app.bsky.feed.post/${rkey}-${i}`,
    ),
    `at://${did}/app.bsky.feed.post/${rkey}`,
  ]
  return {
    _isFeedPostSlice: true,
    _reactKey: `slice-${rkey}`,
    isIncompleteThread: false,
    isFallbackMarker: false,
    feedContext: undefined,
    reqId: undefined,
    feedPostUri: uris[uris.length - 1],
    items: uris.map((uri, i) => ({
      _reactKey: `slice-${rkey}-${i}`,
      uri,
      post: {
        uri,
        author: i === context ? {did, avatar} : {did: 'did:plc:context'},
      },
      record: {},
      moderation: {
        ui: (context: string) =>
          context === 'avatar' ? {blur, filter} : {blur: false, filter: false},
      },
    })),
  } as unknown as FeedPostSlice
}

/** The rows the list renders for `slices`: one per post. */
function rowsOf(slices: FeedPostSlice[]) {
  return slices.flatMap(slice =>
    slice.items.map((item, indexInSlice) => ({
      type: 'sliceItem',
      key: item._reactKey,
      slice,
      indexInSlice,
    })),
  )
}

function page(fetchedAt: number, slices: FeedPostSlice[]) {
  return {fetchedAt, slices}
}

describe('getPrependOffer', () => {
  it('offers the posts from the page the prepend put on top', () => {
    const fresh = [slice('a'), slice('b')]
    const restored = [slice('old')]
    const offer = getPrependOffer(
      rowsOf([...fresh, ...restored]),
      page(PREPENDED_AT, fresh),
    )

    expect(offer).toEqual({
      pages: [PREPENDED_AT],
      keys: ['slice-a-0', 'slice-b-0'],
      count: 2,
      authors: [
        {did: 'did:plc:a', avatar: 'https://cdn.test/a.jpg'},
        {did: 'did:plc:b', avatar: 'https://cdn.test/b.jpg'},
      ],
    })
  })

  it('counts a reply once, with its thread context', () => {
    const reply = slice('reply', {context: 2})
    const offer = getPrependOffer(rowsOf([reply]), page(PREPENDED_AT, [reply]))

    expect(offer?.count).toBe(1)
    expect(offer?.keys).toEqual([
      'slice-reply-0',
      'slice-reply-1',
      'slice-reply-2',
    ])
    // The face is the reply's author, not the thread's.
    expect(offer?.authors.map(author => author.did)).toEqual(['did:plc:reply'])
  })

  it('never offers saved-feed samples, the gap row or rows the list leaves out', () => {
    const fresh = [slice('a'), slice('muted'), slice('b')]
    const sample = slice('sample')
    const rows = [
      ...rowsOf([fresh[0], sample, fresh[2]]),
      {type: 'gap', key: 'gap-cursor'},
      ...rowsOf([slice('old')]),
    ]
    // The page is the one without samples, as PostFeed has it.
    const offer = getPrependOffer(rows, page(PREPENDED_AT, fresh))

    expect(offer?.count).toBe(2)
    expect(offer?.keys).toEqual(['slice-a-0', 'slice-b-0'])
    expect(offer?.authors.map(author => author.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
    ])
  })

  it('offers posts on top of an offer the reader has not reached', () => {
    const fresh = [slice('a'), slice('b')]
    const unread = getPrependOffer(rowsOf(fresh), page(PREPENDED_AT, fresh))!
    const later = [slice('c'), slice('a2', {did: 'did:plc:a'})]

    const offer = getPrependOffer(
      rowsOf([...later, ...fresh]),
      page(LATER_AT, later),
      unread,
    )

    expect(offer).toEqual({
      pages: [LATER_AT, PREPENDED_AT],
      keys: ['slice-c-0', 'slice-a2-0', 'slice-a-0', 'slice-b-0'],
      count: 4,
      authors: [
        {did: 'did:plc:c', avatar: 'https://cdn.test/c.jpg'},
        {did: 'did:plc:a', avatar: 'https://cdn.test/a2.jpg'},
        {did: 'did:plc:b', avatar: 'https://cdn.test/b.jpg'},
      ],
    })
    // None of a page's posts render: the unread offer is as it was.
    expect(
      getPrependOffer(rowsOf(fresh), page(LATER_AT, [slice('muted')]), unread),
    ).toBe(unread)
  })

  it('offers nothing when none of the page renders', () => {
    const fresh = [slice('muted')]
    expect(
      getPrependOffer(rowsOf([slice('old')]), page(PREPENDED_AT, fresh)),
    ).toBeUndefined()
  })

  it('shows up to three distinct faces, safe to show, in order', () => {
    const fresh = [
      slice('a'),
      slice('a2', {did: 'did:plc:a'}),
      slice('noAvatar', {avatar: ''}),
      slice('blurred', {blur: true}),
      slice('filtered', {filter: true}),
      slice('b'),
      slice('c'),
      slice('d'),
    ]
    const offer = getPrependOffer(rowsOf(fresh), page(PREPENDED_AT, fresh))

    expect(offer?.count).toBe(8)
    expect(offer?.authors.map(author => author.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
      'did:plc:c',
    ])
  })

  it('makes a facepile from four posts with a face to show', () => {
    const presentation = (slices: FeedPostSlice[]) => {
      const offer = getPrependOffer(rowsOf(slices), page(PREPENDED_AT, slices))!
      return newPostsPillPresentation({
        variant: 'newPosts',
        count: offer.count,
        faceCount: offer.authors.length,
      })
    }

    expect(presentation([slice('a'), slice('b'), slice('c')])).toBe('generic')
    expect(presentation([slice('a'), slice('b'), slice('c'), slice('d')])).toBe(
      'facepile',
    )
    expect(
      presentation(['a', 'b', 'c', 'd'].map(rkey => slice(rkey, {blur: true}))),
    ).toBe('generic')
  })
})

describe('livePrependOffer', () => {
  const fresh = [slice('a'), slice('b'), slice('c')]
  const offer = getPrependOffer(rowsOf(fresh), page(PREPENDED_AT, fresh))!

  it('follows the rows that still render', () => {
    expect(livePrependOffer(offer, rowsOf(fresh))).toEqual({
      topKey: 'slice-a-0',
      authors: offer.authors,
    })

    // A or its author muted, and a label on C's avatar.
    const now = livePrependOffer(
      offer,
      rowsOf([fresh[1], slice('c', {blur: true})]),
    )
    expect(now.topKey).toBe('slice-b-0')
    expect(now.authors.map(author => author.did)).toEqual(['did:plc:b'])
  })

  it('has no top once none of them render', () => {
    expect(livePrependOffer(offer, rowsOf([slice('old')])).topKey).toBe(
      undefined,
    )
  })
})

describe('usePrependPill', () => {
  const fresh = [slice('a'), slice('b'), slice('c'), slice('d')]
  const old = [slice('old')]
  const restoredPages = [page(RESTORED_AT, old)]
  const prependedPages = [page(PREPENDED_AT, fresh), page(RESTORED_AT, old)]

  type Props = {
    enabled?: boolean
    isActive?: boolean
    prependedAt?: number
    pages?: ReturnType<typeof page>[]
  }

  function renderPill(initialProps: Props = {}) {
    const offsetY = {value: 400, get: () => offsetY.value}
    const scrollToTop = jest.fn()
    const hook = renderHook(
      ({
        enabled = true,
        isActive = true,
        prependedAt,
        pages = restoredPages,
      }: Props) =>
        usePrependPill({
          enabled,
          isActive,
          prependedAt,
          pages,
          rows: rowsOf(pages.flatMap(page => page.slices)),
          offsetY,
          scrollToTop,
        }),
      {initialProps},
    )
    /** The prepend's commit, then the render that has its page. */
    const prepend = (props: Props = {}) => {
      hook.rerender({...props, prependedAt: PREPENDED_AT})
      hook.rerender({
        ...props,
        prependedAt: PREPENDED_AT,
        pages: prependedPages,
      })
    }
    /** A later prepend of `slices` above the first, as `prepend` makes. */
    const prependLater = (slices: FeedPostSlice[], props: Props = {}) => {
      const pages = [page(LATER_AT, slices), ...prependedPages]
      hook.rerender({...props, prependedAt: LATER_AT, pages: prependedPages})
      hook.rerender({...props, prependedAt: LATER_AT, pages})
    }
    return {hook, offsetY, scrollToTop, prepend, prependLater}
  }

  describe('shows', () => {
    it('once the posts a prepend put above the restored top render', () => {
      const {hook} = renderPill()
      expect(hook.result.current.visible).toBe(false)

      // Committed, but not yet rendered.
      hook.rerender({prependedAt: PREPENDED_AT})
      expect(hook.result.current.visible).toBe(false)

      hook.rerender({prependedAt: PREPENDED_AT, pages: prependedPages})
      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 4,
        authors: [{did: 'did:plc:a'}, {did: 'did:plc:b'}, {did: 'did:plc:c'}],
      })
    })

    it('never without a prepend', () => {
      const {hook} = renderPill()
      hook.rerender({pages: prependedPages})
      expect(hook.result.current.visible).toBe(false)
    })

    it('never for a prepend none of whose posts render', () => {
      const {hook} = renderPill()
      hook.rerender({prependedAt: PREPENDED_AT})
      hook.rerender({
        prependedAt: PREPENDED_AT,
        // Rows built from these pages leave out the duplicate's page.
        pages: [page(PREPENDED_AT, []), page(RESTORED_AT, old)],
      })
      expect(hook.result.current.visible).toBe(false)
    })

    it('only while the view is active, including after a prepend in the background', () => {
      const {hook, prepend} = renderPill({isActive: false})
      prepend({isActive: false})
      expect(hook.result.current.visible).toBe(false)

      hook.rerender({
        isActive: true,
        prependedAt: PREPENDED_AT,
        pages: prependedPages,
      })
      expect(hook.result.current.visible).toBe(true)

      hook.rerender({
        isActive: false,
        prependedAt: PREPENDED_AT,
        pages: prependedPages,
      })
      expect(hook.result.current.visible).toBe(false)
    })

    it('with what it first offered, not a live count', () => {
      const {hook, prepend} = renderPill()
      prepend()
      expect(hook.result.current.count).toBe(4)

      // Some of the posts go, as a mute takes them out.
      hook.rerender({
        prependedAt: PREPENDED_AT,
        pages: [page(PREPENDED_AT, fresh.slice(2)), page(RESTORED_AT, old)],
      })
      expect(hook.result.current.visible).toBe(true)
      expect(hook.result.current.count).toBe(4)
      // Their faces go with them.
      expect(hook.result.current.authors.map(author => author.did)).toEqual([
        'did:plc:c',
      ])
    })

    it('not with following v2 off, or on web', () => {
      const {hook, prepend} = renderPill({enabled: false})
      prepend({enabled: false})
      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('hides', () => {
    it('once the topmost new post is seen after a drag', () => {
      const {hook, prepend} = renderPill()
      prepend()

      // Seen without a drag, the row is behind the header.
      act(() => hook.result.current.onItemSeen({key: 'slice-a-0'}))
      expect(hook.result.current.visible).toBe(true)

      act(() => hook.result.current.onBeginDrag())
      act(() => hook.result.current.onItemSeen({key: 'slice-d-0'}))
      expect(hook.result.current.visible).toBe(true)

      act(() => hook.result.current.onItemSeen({key: 'slice-a-0'}))
      expect(hook.result.current.visible).toBe(false)
    })

    it('once the list reaches its top', () => {
      const {hook, prepend} = renderPill()
      prepend()

      act(() => hook.result.current.onReachTop())

      expect(hook.result.current.visible).toBe(false)
    })

    it('once a refresh replaces the top page', () => {
      const {hook, prepend} = renderPill()
      prepend()

      hook.rerender({
        prependedAt: PREPENDED_AT,
        pages: [page(PREPENDED_AT + 1, [slice('fresh')])],
      })

      expect(hook.result.current.visible).toBe(false)
    })

    it('but not when the reader reaches the top before the prepend', () => {
      const {hook, prepend} = renderPill()
      act(() => hook.result.current.onReachTop())
      prepend()
      expect(hook.result.current.visible).toBe(true)
    })
  })

  describe('a later prepend', () => {
    it('adds its posts to an offer the reader has not reached', () => {
      const {hook, prepend, prependLater} = renderPill()
      prepend()

      prependLater([slice('e'), slice('f', {did: 'did:plc:a'})])

      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 6,
        authors: [{did: 'did:plc:e'}, {did: 'did:plc:a'}, {did: 'did:plc:b'}],
      })
      // It hides once the reader reaches the newest of them.
      act(() => hook.result.current.onBeginDrag())
      act(() => hook.result.current.onItemSeen({key: 'slice-a-0'}))
      expect(hook.result.current.visible).toBe(true)
      act(() => hook.result.current.onItemSeen({key: 'slice-e-0'}))
      expect(hook.result.current.visible).toBe(false)
    })

    it('offers only its own posts once the reader has reached the last', () => {
      const {hook, prepend, prependLater} = renderPill()
      prepend()
      act(() => hook.result.current.onReachTop())

      prependLater([slice('e')])

      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 1,
        authors: [{did: 'did:plc:e'}],
      })
    })

    it('keeps the offer as it was when none of its posts render', () => {
      const {hook, prepend, prependLater} = renderPill()
      prepend()

      prependLater([])

      expect(hook.result.current.visible).toBe(true)
      expect(hook.result.current.count).toBe(4)
    })

    it('offers nothing when none of its posts render, and nothing is unread', () => {
      const {hook, prepend, prependLater} = renderPill()
      prepend()
      act(() => hook.result.current.onReachTop())

      prependLater([])

      expect(hook.result.current.visible).toBe(false)
    })

    it('needs another drag before the reader seeing its top row hides it', () => {
      const {hook, prepend, prependLater} = renderPill()
      prepend()
      act(() => hook.result.current.onBeginDrag())

      prependLater([slice('e')])

      // Seen without a drag since, the row is behind the header.
      act(() => hook.result.current.onItemSeen({key: 'slice-e-0'}))
      expect(hook.result.current.visible).toBe(true)
      act(() => hook.result.current.onBeginDrag())
      act(() => hook.result.current.onItemSeen({key: 'slice-e-0'}))
      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('pressed', () => {
    it('scrolls up to the top, which hides it', () => {
      const {hook, offsetY, scrollToTop, prepend} = renderPill()
      prepend()
      offsetY.value = 10_000

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalled()
      // The press alone doesn't, but the scroll reaching the top does.
      expect(hook.result.current.visible).toBe(true)
      act(() => hook.result.current.onReachTop())
      expect(hook.result.current.visible).toBe(false)
    })

    it('hides it already at the top, where no scroll reaches it', () => {
      const {hook, offsetY, scrollToTop, prepend} = renderPill()
      prepend()
      offsetY.value = 0

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalled()
      expect(hook.result.current.visible).toBe(false)
    })
  })
})
