import {Dimensions} from 'react-native'
import {act, renderHook} from '@testing-library/react-native'

import {newPostsPillPresentation} from '#/components/NewPostsPill/presentation'
import {type FeedPostSlice} from './queries/postFeed'
import {
  getRestoreOffer,
  liveRestoreOffer,
  PILL_ANIMATED_REVEAL_SCREENS,
  useRestorePill,
} from './useRestorePill'

// Only its constant: its hooks need queries this doesn't set up.
jest.mock('./useSettleAtTop', () => ({SETTLE_AT_TOP_LIMIT: 5}))

const RESTORED_AT = 1000
const PREPENDED_AT = 2000

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

describe('getRestoreOffer', () => {
  it('offers the posts from the page the prepend put on top', () => {
    const fresh = [slice('a'), slice('b')]
    const restored = [slice('old')]
    const offer = getRestoreOffer(
      rowsOf([...fresh, ...restored]),
      page(PREPENDED_AT, fresh),
    )

    expect(offer).toEqual({
      topFetchedAt: PREPENDED_AT,
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
    const offer = getRestoreOffer(rowsOf([reply]), page(PREPENDED_AT, [reply]))

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
    const offer = getRestoreOffer(rows, page(PREPENDED_AT, fresh))

    expect(offer?.count).toBe(2)
    expect(offer?.keys).toEqual(['slice-a-0', 'slice-b-0'])
    expect(offer?.authors.map(author => author.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
    ])
  })

  it('offers nothing when none of the page renders', () => {
    const fresh = [slice('muted')]
    expect(
      getRestoreOffer(rowsOf([slice('old')]), page(PREPENDED_AT, fresh)),
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
    const offer = getRestoreOffer(rowsOf(fresh), page(PREPENDED_AT, fresh))

    expect(offer?.count).toBe(8)
    expect(offer?.authors.map(author => author.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
      'did:plc:c',
    ])
  })

  it('makes a facepile from four posts with a face to show', () => {
    const presentation = (slices: FeedPostSlice[]) => {
      const offer = getRestoreOffer(rowsOf(slices), page(PREPENDED_AT, slices))!
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

describe('liveRestoreOffer', () => {
  const fresh = [slice('a'), slice('b'), slice('c')]
  const offer = getRestoreOffer(rowsOf(fresh), page(PREPENDED_AT, fresh))!

  it('follows the rows that still render', () => {
    expect(liveRestoreOffer(offer, rowsOf(fresh))).toEqual({
      topKey: 'slice-a-0',
      authors: offer.authors,
    })

    // A or its author muted, and a label on C's avatar.
    const now = liveRestoreOffer(
      offer,
      rowsOf([fresh[1], slice('c', {blur: true})]),
    )
    expect(now.topKey).toBe('slice-b-0')
    expect(now.authors.map(author => author.did)).toEqual(['did:plc:b'])
  })

  it('has no top once none of them render', () => {
    expect(liveRestoreOffer(offer, rowsOf([slice('old')])).topKey).toBe(
      undefined,
    )
  })
})

describe('useRestorePill', () => {
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
        useRestorePill({
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
    return {hook, offsetY, scrollToTop, prepend}
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

  describe('hides for good', () => {
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

  describe('pressed', () => {
    const screen = Dimensions.get('window').height

    it('scrolls up to the top with an animation from near it, which hides it', () => {
      const {hook, offsetY, scrollToTop, prepend} = renderPill()
      prepend()
      offsetY.value = screen * PILL_ANIMATED_REVEAL_SCREENS

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalledWith(true)
      // The press alone doesn't, but the scroll reaching the top does.
      expect(hook.result.current.visible).toBe(true)
      act(() => hook.result.current.onReachTop())
      expect(hook.result.current.visible).toBe(false)
    })

    it('jumps to the top without an animation from far below it', () => {
      const {hook, offsetY, scrollToTop, prepend} = renderPill()
      prepend()
      offsetY.value = screen * PILL_ANIMATED_REVEAL_SCREENS + 1

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalledWith(false)
    })

    it('hides it already at the top, where no scroll reaches it', () => {
      const {hook, offsetY, scrollToTop, prepend} = renderPill()
      prepend()
      offsetY.value = 0

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalledWith(true)
      expect(hook.result.current.visible).toBe(false)
    })
  })
})
