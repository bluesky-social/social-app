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
 * What the pill offers: the posts a restore prepend put above the restored
 * top, as they first rendered. It's a snapshot, so its count stays as it was
 * however the rows change, while its faces only ever drop out (see
 * {@link liveRestoreOffer}).
 */
export type RestoreOffer = {
  /**
   * The `fetchedAt` of the page the prepend put on top. The offer lasts while
   * it's still the top page, so a refresh, or anything else that replaces it,
   * ends it.
   */
  topFetchedAt: number
  /** The keys of the offered rows, top first. */
  keys: string[]
  /**
   * How many posts are offered: one per feed item, as a reply's thread
   * context isn't a new post of its own.
   */
  count: number
  /**
   * Up to {@link FACE_LIMIT} of the posts' authors, distinct and in order,
   * leaving out any whose avatar isn't safe to show.
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

/**
 * What a restore prepend's `page` offers, as the list renders it: the post rows
 * from that page, which are the rows above the restored top. Rows the list
 * leaves out, such as muted authors', aren't offered. Neither are saved-feed
 * samples, as `page` is the page without them, nor the gap row below it.
 * `undefined` when none of the page's posts render.
 */
export function getRestoreOffer(
  rows: readonly Row[],
  page: Page,
): RestoreOffer | undefined {
  const slices = new Set(page.slices)
  const counted = new Set<FeedPostSlice>()
  const keys: string[] = []
  const authors: NewPostsPillAuthor[] = []
  for (const row of rows) {
    if (row.type !== 'sliceItem' || !row.slice || !slices.has(row.slice)) {
      continue
    }
    keys.push(row.key)
    if (counted.has(row.slice)) {
      continue
    }
    counted.add(row.slice)
    const face = faceOf(row.slice)
    if (
      face &&
      authors.length < FACE_LIMIT &&
      !authors.some(author => author.did === face.did)
    ) {
      authors.push(face)
    }
  }
  if (!counted.size) {
    return undefined
  }
  return {topFetchedAt: page.fetchedAt, keys, count: counted.size, authors}
}

/**
 * The parts of `offer` that follow the rows as they are now: the topmost of
 * its rows that still renders, `undefined` once none do, and the faces whose
 * posts still render with an avatar that's safe to show, as a deletion, a mute
 * or a block can take a post away and a label can make an avatar unsafe.
 */
export function liveRestoreOffer(
  offer: RestoreOffer,
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
 * The new posts pill for a view's restore prepend (see
 * `usePostFeedRestorePrepend`). Once the posts the prepend put above the
 * restored top render, it takes a snapshot of them as its offer (see
 * {@link getRestoreOffer}). There's at most one, as the prepend runs once per
 * view.
 *
 * The pill shows while the view is active, the offer's page is still on top
 * and some of its rows still render, which includes a view that prepended in
 * the background becoming active. It hides for good when the reader reaches
 * the posts:
 *
 * - The topmost offered row is seen, if the reader has dragged the list since
 *   the offer. Until they have, the only rows the list reports as seen are
 *   the ones behind the header, just above the row the anchor kept on screen.
 * - The list reaches its top, by any means, including the scroll a press of
 *   the pill makes. A press alone doesn't hide it.
 *
 * Pressing it scrolls up to the top, without fetching.
 */
export function useRestorePill({
  enabled,
  isActive,
  prependedAt,
  rows,
  pages,
  offsetY,
  scrollToTop,
}: {
  /** Whether the view offers restored posts at all. */
  enabled: boolean
  /** Whether the view is the one on screen. */
  isActive: boolean
  /**
   * The `fetchedAt` of the page the view's restore prepend put on top, once
   * it has.
   */
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
  const [offer, setOffer] = useState<RestoreOffer>()
  const [isDone, setIsDone] = useState(false)
  /** Whether the reader has dragged the list since the offer was made. */
  const hasDragged = useRef(false)

  const top = pages?.[0]
  // The rows from the prepend's page render after it commits.
  if (
    enabled &&
    !offer &&
    !isDone &&
    prependedAt !== undefined &&
    top?.fetchedAt === prependedAt
  ) {
    const next = getRestoreOffer(rows, top)
    if (next) {
      setOffer(next)
    } else {
      setIsDone(true)
    }
  }

  const live =
    offer && top?.fetchedAt === offer.topFetchedAt
      ? liveRestoreOffer(offer, rows)
      : undefined

  return {
    visible: enabled && isActive && !isDone && live?.topKey !== undefined,
    count: offer?.count ?? 0,
    authors: live?.authors ?? [],
    onPress: () => {
      // Already at the top, there's no scroll to report reaching it.
      if (offsetY.get() <= SETTLE_AT_TOP_LIMIT) {
        setIsDone(true)
      }
      scrollToTop()
    },
    onBeginDrag: () => {
      if (offer) {
        hasDragged.current = true
      }
    },
    onItemSeen: (row: {key: string}) => {
      if (hasDragged.current && row.key === live?.topKey) {
        setIsDone(true)
      }
    },
    onReachTop: () => {
      if (prependedAt !== undefined) {
        setIsDone(true)
      }
    },
  }
}
