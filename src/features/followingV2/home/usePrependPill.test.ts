import {act, renderHook} from '@testing-library/react-native'

import {newPostsPillPresentation} from '#/components/NewPostsPill/presentation'
import {type FeedPostSlice, type StagedPage} from './queries/postFeed'
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
  it('offers the posts from the page a prepend staged on top', () => {
    const fresh = [slice('a'), slice('b')]
    const restored = [slice('old')]
    const offer = getPrependOffer(
      rowsOf([...fresh, ...restored]),
      page(PREPENDED_AT, fresh),
    )

    expect(offer).toEqual({
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
  const OFFERED = {fetchedAt: PREPENDED_AT, offered: true}

  type Props = {
    enabled?: boolean
    isActive?: boolean
    staged?: StagedPage
    pages?: ReturnType<typeof page>[]
  }

  function renderPill(initialProps: Props = {}) {
    const offsetY = {value: 400, get: () => offsetY.value}
    const scrollToTop = jest.fn()
    const onRead = jest.fn()
    const hook = renderHook(
      ({
        enabled = true,
        isActive = true,
        staged,
        pages = restoredPages,
      }: Props) =>
        usePrependPill({
          enabled,
          isActive,
          staged,
          pages,
          rows: rowsOf(pages.flatMap(page => page.slices)),
          offsetY,
          scrollToTop,
          onRead,
        }),
      {initialProps},
    )
    /** A prepend's commit of `staged`, then the render that has its page. */
    const stage = (staged: StagedPage = OFFERED, props: Props = {}) => {
      hook.rerender({...props, staged})
      hook.rerender({...props, staged, pages: prependedPages})
    }
    /** A later prepend that replaces the staged page with `slices`. */
    const replace = (
      slices: FeedPostSlice[],
      {offered = true, ...props}: Props & {offered?: boolean} = {},
    ) => {
      const staged = {fetchedAt: LATER_AT, offered}
      hook.rerender({...props, staged, pages: prependedPages})
      hook.rerender({
        ...props,
        staged,
        pages: [page(LATER_AT, slices), page(RESTORED_AT, old)],
      })
    }
    return {hook, offsetY, scrollToTop, onRead, stage, replace}
  }

  describe('shows', () => {
    it('once the offered posts a prepend staged above the restored top render', () => {
      const {hook} = renderPill()
      expect(hook.result.current.visible).toBe(false)

      // Committed, but not yet rendered.
      hook.rerender({staged: OFFERED})
      expect(hook.result.current.visible).toBe(false)

      hook.rerender({staged: OFFERED, pages: prependedPages})
      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 4,
        authors: [{did: 'did:plc:a'}, {did: 'did:plc:b'}, {did: 'did:plc:c'}],
      })
    })

    it('never without a staged page', () => {
      const {hook} = renderPill()
      hook.rerender({pages: prependedPages})
      expect(hook.result.current.visible).toBe(false)
    })

    it('never for a staged page that is not offered, as a check on an interval stages', () => {
      const {hook, stage} = renderPill()
      stage({fetchedAt: PREPENDED_AT, offered: false})
      expect(hook.result.current.visible).toBe(false)
    })

    it('when a page staged without an offer is offered later, with the posts as they render then', () => {
      const {hook, stage} = renderPill()
      const quiet = {fetchedAt: PREPENDED_AT, offered: false}
      stage(quiet)
      // A post goes, as a mute takes it out, before a return offers the page.
      hook.rerender({
        staged: quiet,
        pages: [page(PREPENDED_AT, fresh.slice(1)), page(RESTORED_AT, old)],
      })

      hook.rerender({
        staged: OFFERED,
        pages: [page(PREPENDED_AT, fresh.slice(1)), page(RESTORED_AT, old)],
      })

      expect(hook.result.current).toMatchObject({visible: true, count: 3})
    })

    it('never for a staged page none of whose posts render', () => {
      const {hook} = renderPill()
      hook.rerender({staged: OFFERED})
      hook.rerender({
        staged: OFFERED,
        // Rows built from these pages leave out the duplicate's page.
        pages: [page(PREPENDED_AT, []), page(RESTORED_AT, old)],
      })
      expect(hook.result.current.visible).toBe(false)
    })

    it('only while the view is active, including after a prepend in the background', () => {
      const {hook, stage} = renderPill({isActive: false})
      stage(OFFERED, {isActive: false})
      expect(hook.result.current.visible).toBe(false)

      hook.rerender({isActive: true, staged: OFFERED, pages: prependedPages})
      expect(hook.result.current.visible).toBe(true)

      hook.rerender({isActive: false, staged: OFFERED, pages: prependedPages})
      expect(hook.result.current.visible).toBe(false)
    })

    it('with what it first offered, not a live count', () => {
      const {hook, stage} = renderPill()
      stage()
      expect(hook.result.current.count).toBe(4)

      // Some of the posts go, as a mute takes them out.
      hook.rerender({
        staged: OFFERED,
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
      const {hook, stage} = renderPill({enabled: false})
      stage(OFFERED, {enabled: false})
      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('a page that replaces the staged one', () => {
    it('keeps the pill, with exactly the posts it has', () => {
      const {hook, stage, replace} = renderPill()
      stage()

      replace([slice('e'), ...fresh])

      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 5,
        authors: [{did: 'did:plc:e'}, {did: 'did:plc:a'}, {did: 'did:plc:b'}],
      })
    })

    it('raises no pill for a page that was not offered', () => {
      const {hook, stage, replace} = renderPill()
      stage({fetchedAt: PREPENDED_AT, offered: false})

      replace([slice('e'), ...fresh], {offered: false})

      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('hides', () => {
    it('once the staged page is read', () => {
      const {hook, stage} = renderPill()
      stage()

      hook.rerender({staged: undefined, pages: prependedPages})

      expect(hook.result.current.visible).toBe(false)
      // The pill keeps its count as it goes.
      expect(hook.result.current.count).toBe(4)
    })

    it('once a refresh replaces the top page', () => {
      const {hook, stage} = renderPill()
      stage()

      hook.rerender({
        staged: OFFERED,
        pages: [page(PREPENDED_AT + 1, [slice('fresh')])],
      })

      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('pressed', () => {
    it('scrolls up to the top, without reading the page itself', () => {
      const {hook, offsetY, scrollToTop, onRead, stage} = renderPill()
      stage()
      offsetY.value = 10_000

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalled()
      // The scroll reaching the top reads it.
      expect(onRead).not.toHaveBeenCalled()
    })

    it('reads the page already at the top, where no scroll reaches it', () => {
      const {hook, offsetY, scrollToTop, onRead, stage} = renderPill()
      stage()
      offsetY.value = 0

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalled()
      expect(onRead).toHaveBeenCalled()
    })
  })
})
