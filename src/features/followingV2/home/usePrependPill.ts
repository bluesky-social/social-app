import {useRef, useState} from 'react'

import {type NewPostsPillAuthor} from '#/components/NewPostsPill'
import {type FeedPostSlice} from './queries/postFeed'
import {SETTLE_AT_TOP_LIMIT} from './useSettleAtTop'

/** How many faces the pill shows. */
const FACE_LIMIT = 3

/** The parts of a feed row that the pill reads. */
type Row = {
  type: string
  key: string
  slice?: FeedPostSlice
}

/** The parts of a rendered feed page that the pill reads. */
type Page = {
  fetchedAt: number
  slices: readonly FeedPostSlice[]
}

/**
 * What the pill offers: the posts the view's prepends put above where the
 * reader was, as they first rendered, which the reader hasn't reached yet. It's
 * a snapshot, so its count stays as it was however the rows change, while its
 * faces only ever drop out (see {@link livePrependOffer}).
 */
export type PrependOffer = {
  /**
   * The `fetchedAt` of each page it offers posts from, newest first. The offer
   * lasts while any of them is still in the feed, so a refresh, or anything
   * else that replaces them all, ends it.
   */
  pages: number[]
  /** The keys of the offered rows. */
  keys: string[]
  /**
   * How many posts are offered: one per feed item, as a reply's thread
   * context isn't a new post of its own.
   */
  count: number
  /**
   * Up to {@link FACE_LIMIT} of the posts' authors, distinct and newest
   * first, leaving out any whose avatar isn't safe to show.
   */
  authors: NewPostsPillAuthor[]
}

/**
 * The author of a feed item's own post, if their avatar is safe to show: they
 * have one, and moderation neither blurs nor filters it.
 */
function faceOf(slice: FeedPostSlice): NewPostsPillAuthor | undefined {
  const item = slice.items.find(item => item.uri === slice.feedPostUri)
  if (!item) {
    return undefined
  }
  const {did, avatar} = item.post.author
  const ui = item.moderation.ui('avatar')
  if (!avatar || ui.blur || ui.filter) {
    return undefined
  }
  return {did, avatar}
}

/** Adds `face` to `authors`, if it's new and there's room for it. */
function addFace(authors: NewPostsPillAuthor[], face?: NewPostsPillAuthor) {
  if (
    face &&
    authors.length < FACE_LIMIT &&
    !authors.some(author => author.did === face.did)
  ) {
    authors.push(face)
  }
}

/**
 * What a prepend's `page` offers, as the list renders it: the post rows from
 * that page, which are the rows above where the reader was. Rows the list
 * leaves out, such as muted authors', aren't offered. Neither are saved-feed
 * samples, as `page` is the page without them, nor the gap row below it.
 *
 * With `unread`, the offer of the view's earlier prepends that the reader
 * hasn't reached, the page's posts are offered on top of it, as one offer.
 * When none of the page's posts render, that's `unread` as it is, which is
 * `undefined` without one.
 */
export function getPrependOffer(
  rows: readonly Row[],
  page: Page,
  unread?: PrependOffer,
): PrependOffer | undefined {
  const slices = new Set(page.slices)
  const counted = new Set<FeedPostSlice>()
  const keys: string[] = []
  const authors: NewPostsPillAuthor[] = []
  for (const row of rows) {
    if (row.type !== 'sliceItem' || !row.slice || !slices.has(row.slice)) {
      continue
    }
    keys.push(row.key)
    if (!counted.has(row.slice)) {
      counted.add(row.slice)
      addFace(authors, faceOf(row.slice))
    }
  }
  if (!counted.size) {
    return unread
  }
  for (const author of unread?.authors ?? []) {
    addFace(authors, author)
  }
  return {
    pages: [page.fetchedAt, ...(unread?.pages ?? [])],
    keys: [...keys, ...(unread?.keys ?? [])],
    count: counted.size + (unread?.count ?? 0),
    authors,
  }
}

/**
 * The parts of `offer` that follow the rows as they are now: the topmost of
 * its rows that still renders, `undefined` once none do, and the faces whose
 * posts still render with an avatar that's safe to show, as a deletion, a mute
 * or a block can take a post away and a label can make an avatar unsafe.
 */
export function livePrependOffer(
  offer: PrependOffer,
  rows: readonly Row[],
): {topKey: string | undefined; authors: NewPostsPillAuthor[]} {
  const keys = new Set(offer.keys)
  const faces = new Set<string>()
  let topKey: string | undefined
  for (const row of rows) {
    if (row.type !== 'sliceItem' || !row.slice || !keys.has(row.key)) {
      continue
    }
    topKey ??= row.key
    const face = faceOf(row.slice)
    if (face) {
      faces.add(face.did)
    }
  }
  return {
    topKey,
    authors: offer.authors.filter(author => faces.has(author.did)),
  }
}

/**
 * The new posts pill for a view's prepends (see `usePostFeedPrepend`). Once
 * the posts a prepend put on top render, it takes a snapshot of them as its
 * offer (see {@link getPrependOffer}), on top of any posts an earlier one put
 * there that the reader hasn't reached yet.
 *
 * The pill shows while the view is active, some of the offer's pages are still
 * in the feed and some of its rows still render, which includes a view that
 * prepended in the background becoming active. It hides once the reader
 * reaches the posts, until a later prepend offers more:
 *
 * - The topmost offered row is seen, if the reader has dragged the list since
 *   the offer. Until they have, the only rows the list reports as seen are
 *   the ones behind the header, just above the row the anchor kept on screen.
 * - The list reaches its top, by any means, including the scroll a press of
 *   the pill makes. A press alone doesn't hide it.
 *
 * Pressing it scrolls up to the top, without fetching.
 */
export function usePrependPill({
  enabled,
  isActive,
  prependedAt,
  rows,
  pages,
  offsetY,
  scrollToTop,
}: {
  /** Whether the view offers prepended posts at all. */
  enabled: boolean
  /** Whether the view is the one on screen. */
  isActive: boolean
  /** The `fetchedAt` of the last page the view's prepends put on top. */
  prependedAt: number | undefined
  /** The rows the list renders. */
  rows: readonly Row[]
  /** The feed's pages as they render, without saved-feed samples. */
  pages: readonly Page[] | undefined
  /** The list's scroll offset. */
  offsetY: {get(): number}
  /** Scrolls the list to its true top. */
  scrollToTop: () => void
}) {
  const [offer, setOffer] = useState<PrependOffer>()
  /** Whether the reader has reached the posts the offer is of. */
  const [isRead, setIsRead] = useState(false)
  /** The prepend whose page the pill last took a snapshot of. */
  const [takenAt, setTakenAt] = useState<number>()
  /** The offer the reader has dragged the list since, if any. */
  const draggedOffer = useRef<PrependOffer>(undefined)

  const live =
    offer && pages?.some(page => offer.pages.includes(page.fetchedAt))
      ? livePrependOffer(offer, rows)
      : undefined
  const unread = !isRead && live?.topKey !== undefined ? offer : undefined

  const top = pages?.[0]
  // The rows from a prepend's page render after it commits.
  if (
    enabled &&
    prependedAt !== undefined &&
    prependedAt !== takenAt &&
    top?.fetchedAt === prependedAt
  ) {
    setTakenAt(prependedAt)
    const next = getPrependOffer(rows, top, unread)
    if (next && next !== unread) {
      setOffer(next)
      setIsRead(false)
    }
  }

  return {
    visible: enabled && isActive && unread !== undefined,
    // The last offer's, so the pill keeps them as it hides.
    count: offer?.count ?? 0,
    authors: live?.authors ?? [],
    onPress: () => {
      // Already at the top, there's no scroll to report reaching it.
      if (offsetY.get() <= SETTLE_AT_TOP_LIMIT) {
        setIsRead(true)
      }
      scrollToTop()
    },
    onBeginDrag: () => {
      draggedOffer.current = offer
    },
    onItemSeen: (row: {key: string}) => {
      if (draggedOffer.current === offer && row.key === live?.topKey) {
        setIsRead(true)
      }
    },
    onReachTop: () => {
      setIsRead(true)
    },
  }
}
