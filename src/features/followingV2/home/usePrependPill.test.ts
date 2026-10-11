import {act, renderHook} from '@testing-library/react-native'

import {newPostsPillPresentation} from '#/components/NewPostsPill/presentation'
import {type FeedPostSlice, type StagedPage} from './queries/postFeed'
import {getPrependOffer, usePrependPill} from './usePrependPill'

// Only its constant: its hooks need queries this doesn't set up.
jest.mock('./useSettleAtTop', () => ({SETTLE_AT_TOP_LIMIT: 5}))

const RESTORED_AT = 1000
const PREPENDED_AT = 2000
const LATER_AT = 3000
const ABOVE_AT = 9000

/**
 * A feed item by `did`, whose own post is the last of `context` posts before
 * it in its thread. Its rows are keyed by `key`, as the tuner keys them.
 */
function slice(
  rkey: string,
  {
    did = `did:plc:${rkey}`,
    avatar = `https://cdn.test/${rkey}.jpg`,
    blur = false,
    filter = false,
    context = 0,
    key = `slice-${rkey}`,
  }: {
    did?: string
    avatar?: string
    blur?: boolean
    filter?: boolean
    context?: number
    key?: string
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
    _reactKey: key,
    isIncompleteThread: false,
    isFallbackMarker: false,
    feedContext: undefined,
    reqId: undefined,
    feedPostUri: uris[uris.length - 1],
    items: uris.map((uri, i) => ({
      _reactKey: `${key}-${i}`,
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

/** A rendered page, which a prepend fetched from `since` if it has one. */
function page(fetchedAt: number, slices: FeedPostSlice[], since?: string) {
  return {fetchedAt, slices, since}
}

describe('getPrependOffer', () => {
  it('offers the posts from the pages it is given', () => {
    const fresh = [slice('a'), slice('b')]
    const restored = [slice('old')]
    const offer = getPrependOffer(rowsOf([...fresh, ...restored]), [
      page(PREPENDED_AT, fresh),
    ])

    expect(offer).toEqual({
      count: 2,
      authors: [
        {did: 'did:plc:a', avatar: 'https://cdn.test/a.jpg'},
        {did: 'did:plc:b', avatar: 'https://cdn.test/b.jpg'},
      ],
    })
  })

  it('offers the posts from several pages, newest first', () => {
    const above = [slice('e')]
    const fresh = [slice('a'), slice('b')]
    const offer = getPrependOffer(rowsOf([...above, ...fresh, slice('old')]), [
      page(ABOVE_AT, above),
      page(PREPENDED_AT, fresh),
    ])

    expect(offer.count).toBe(3)
    expect(offer.authors.map(author => author.did)).toEqual([
      'did:plc:e',
      'did:plc:a',
      'did:plc:b',
    ])
  })

  it('counts a reply once, with its thread context', () => {
    const reply = slice('reply', {context: 2})
    const offer = getPrependOffer(rowsOf([reply]), [
      page(PREPENDED_AT, [reply]),
    ])

    expect(offer.count).toBe(1)
    // The face is the reply's author, not the thread's.
    expect(offer.authors.map(author => author.did)).toEqual(['did:plc:reply'])
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
    const offer = getPrependOffer(rows, [page(PREPENDED_AT, fresh)])

    expect(offer.count).toBe(2)
    expect(offer.authors.map(author => author.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
    ])
  })

  it('offers nothing when none of the pages render', () => {
    const fresh = [slice('muted')]
    expect(
      getPrependOffer(rowsOf([slice('old')]), [page(PREPENDED_AT, fresh)]),
    ).toEqual({count: 0, authors: []})
  })

  it('lists each author once, with a face safe to show, in order', () => {
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
    const offer = getPrependOffer(rowsOf(fresh), [page(PREPENDED_AT, fresh)])

    expect(offer.count).toBe(8)
    expect(offer.authors.map(author => author.did)).toEqual([
      'did:plc:a',
      'did:plc:b',
      'did:plc:c',
      'did:plc:d',
    ])
  })

  it('makes a facepile from four posts with a face to show', () => {
    const presentation = (slices: FeedPostSlice[]) => {
      const offer = getPrependOffer(rowsOf(slices), [
        page(PREPENDED_AT, slices),
      ])
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

describe('usePrependPill', () => {
  const fresh = [slice('a'), slice('b'), slice('c'), slice('d')]
  const old = [slice('old')]
  /** Where the restored top starts, which a prepend above it fetches from. */
  const SINCE = 'start:1'
  const restoredPages = [page(RESTORED_AT, old)]
  const prependedPages = [
    page(PREPENDED_AT, fresh, SINCE),
    page(RESTORED_AT, old),
  ]
  const OFFERED = {fetchedAt: PREPENDED_AT, offered: true, isFull: false}
  const QUIET = {fetchedAt: PREPENDED_AT, offered: false, isFull: false}

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
    let props = initialProps
    let replacedAt = LATER_AT
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
    /** Renders the view again with `next` changed. */
    const update = (next: Props) => {
      props = {...props, ...next}
      hook.rerender(props)
    }
    /** A prepend's commit of `staged`, then the render that has its page. */
    const stage = (staged: StagedPage = OFFERED) => {
      update({staged})
      update({pages: prependedPages})
    }
    /** A later prepend from the same place, which replaces the staged page. */
    const replace = (
      slices: FeedPostSlice[],
      {offered = false}: {offered?: boolean} = {},
    ) => {
      const fetchedAt = replacedAt++
      update({staged: {fetchedAt, offered, isFull: false}})
      update({pages: [page(fetchedAt, slices, SINCE), page(RESTORED_AT, old)]})
    }
    /** The reader reaches the staged page, which reads it. */
    const read = () => update({staged: undefined})
    /** A later prepend above the page the reader has read. */
    const stageAbove = (
      slices: FeedPostSlice[],
      {offered = false}: {offered?: boolean} = {},
    ) => {
      update({staged: {fetchedAt: ABOVE_AT, offered, isFull: false}})
      update({
        pages: [page(ABOVE_AT, slices, 'start:2'), ...(props.pages ?? [])],
      })
    }
    const dismiss = () => act(() => hook.result.current.dismiss())
    return {
      hook,
      offsetY,
      scrollToTop,
      onRead,
      update,
      stage,
      replace,
      read,
      stageAbove,
      dismiss,
    }
  }

  describe('goes up', () => {
    it('once the offered posts a prepend staged above the restored top render', () => {
      const {hook, update} = renderPill()
      expect(hook.result.current.visible).toBe(false)

      // Committed, but not yet rendered.
      update({staged: OFFERED})
      expect(hook.result.current.visible).toBe(false)

      update({pages: prependedPages})
      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 4,
        authors: [{did: 'did:plc:a'}, {did: 'did:plc:b'}, {did: 'did:plc:c'}],
      })
    })

    it('never without a staged page', () => {
      const {hook, update} = renderPill()
      update({pages: prependedPages})
      expect(hook.result.current.visible).toBe(false)
    })

    it('never for a staged page that is not offered, as a check on an interval stages', () => {
      const {hook, stage} = renderPill()
      stage(QUIET)
      expect(hook.result.current.visible).toBe(false)
    })

    it('when a page staged without an offer is offered later, with the posts as they render then', () => {
      const {hook, stage, update} = renderPill()
      stage(QUIET)
      // A post goes, as a mute takes it out, before a return offers the page.
      const pages = [
        page(PREPENDED_AT, fresh.slice(1), SINCE),
        ...restoredPages,
      ]
      update({pages})

      update({staged: OFFERED})

      expect(hook.result.current).toMatchObject({visible: true, count: 3})
    })

    it('never for an offered page none of whose posts render', () => {
      const {hook, update} = renderPill()
      update({staged: OFFERED})
      // Rows built from these pages leave out the duplicate's page.
      update({pages: [page(PREPENDED_AT, [], SINCE), ...restoredPages]})
      expect(hook.result.current.visible).toBe(false)
    })

    it('only while the view is active, including after a prepend in the background', () => {
      const {hook, stage, update} = renderPill({isActive: false})
      stage()
      expect(hook.result.current.visible).toBe(false)

      update({isActive: true})
      expect(hook.result.current.visible).toBe(true)

      update({isActive: false})
      expect(hook.result.current.visible).toBe(false)
    })

    it('not with following v2 off, or on web', () => {
      const {hook, stage} = renderPill({enabled: false})
      stage()
      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('while up', () => {
    it('stays up once the reader reads the staged page', () => {
      const {hook, stage, read} = renderPill()
      stage()

      read()

      expect(hook.result.current).toMatchObject({visible: true, count: 4})
    })

    it('counts the offered posts that still render', () => {
      const {hook, stage, update} = renderPill()
      stage()

      // Some of the posts go, as a mute takes them out.
      update({
        pages: [page(PREPENDED_AT, fresh.slice(2), SINCE), ...restoredPages],
      })

      expect(hook.result.current).toMatchObject({visible: true, count: 2})
      // Their faces go with them, and no other takes their place.
      expect(hook.result.current.authors.map(author => author.did)).toEqual([
        'did:plc:c',
      ])
    })

    it('takes in a page that replaces the staged one, with exactly the posts it has', () => {
      const {hook, stage, replace} = renderPill()
      stage()

      replace([slice('e'), ...fresh])

      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 5,
        authors: [{did: 'did:plc:e'}, {did: 'did:plc:a'}, {did: 'did:plc:b'}],
      })
    })

    it('counts the posts of a replaced page once, whatever their rows are keyed', () => {
      const {hook, stage, replace} = renderPill()
      stage()

      // The same posts, tuned again with the staged page they replace gone.
      replace(
        ['a', 'b', 'c', 'd'].map(rkey => slice(rkey, {key: `re-${rkey}`})),
      )

      expect(hook.result.current).toMatchObject({visible: true, count: 4})
    })

    it('takes in a page staged above the posts it offers, whatever staged it', () => {
      const {hook, stage, read, stageAbove} = renderPill()
      stage()
      read()

      stageAbove([slice('e'), slice('f')])

      expect(hook.result.current).toMatchObject({
        visible: true,
        count: 6,
        authors: [{did: 'did:plc:e'}, {did: 'did:plc:f'}, {did: 'did:plc:a'}],
      })
    })
  })

  describe('comes down', () => {
    it('when the reader reaches the true top, and stays down until the next offer', () => {
      const {hook, stage, dismiss, replace} = renderPill()
      stage()

      dismiss()
      expect(hook.result.current.visible).toBe(false)

      // A check that stages more without an offer leaves it down.
      replace([slice('e'), ...fresh])
      expect(hook.result.current.visible).toBe(false)

      replace([slice('f'), slice('e'), ...fresh], {offered: true})
      expect(hook.result.current).toMatchObject({visible: true, count: 6})
    })

    it('once a refresh replaces the feed', () => {
      const {hook, stage, update, stageAbove} = renderPill()
      stage()

      update({pages: [page(PREPENDED_AT + 1, [slice('fresh')])]})
      expect(hook.result.current.visible).toBe(false)

      // Nor does a check that stages more without an offer put it back.
      stageAbove([slice('e')])
      expect(hook.result.current.visible).toBe(false)
    })

    it('once none of its posts render', () => {
      const {hook, stage, update, replace} = renderPill()
      stage()

      // As a block takes them all out.
      update({pages: [page(PREPENDED_AT, [], SINCE), ...restoredPages]})
      expect(hook.result.current.visible).toBe(false)

      replace([slice('e')])
      expect(hook.result.current.visible).toBe(false)
    })
  })

  describe('pressed', () => {
    it('scrolls up to the top and comes down, without reading the page itself', () => {
      const {hook, offsetY, scrollToTop, onRead, stage} = renderPill()
      stage()
      offsetY.value = 10_000

      act(() => hook.result.current.onPress())

      expect(scrollToTop).toHaveBeenCalled()
      expect(hook.result.current.visible).toBe(false)
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
      expect(hook.result.current.visible).toBe(false)
    })
  })
})
