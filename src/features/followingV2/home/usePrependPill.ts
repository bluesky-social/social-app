import {useState} from 'react'

import {type NewPostsPillAuthor} from '#/components/NewPostsPill'
import {type FeedPostSlice, type StagedPage} from './queries/postFeed'
import {SETTLE_AT_TOP_LIMIT} from './useSettleAtTop'

/** How many faces the pill shows. */
const FACE_LIMIT = 3

const NO_OFFER: PrependOffer = {count: 0, authors: []}

/** What put the pill up: a restore, or a significant return to the app. */
export type PrependPillSource = NonNullable<StagedPage['offeredBy']>

/**
 * Why the pill came down:
 *
 * - `reachedTop`: the reader reached the true top (`dismiss`).
 * - `pressed`: the reader pressed it.
 * - `replaced`: its pages left the feed, as when a refresh replaces it.
 * - `gone`: its pages are there, but none of their posts render, as after a
 *   deletion, a mute or a block.
 */
export type PrependPillHideReason =
  'reachedTop' | 'pressed' | 'replaced' | 'gone'

/** The parts of a feed row that the pill reads. */
type Row = {
  type: string
  slice?: FeedPostSlice
}

/** The parts of a rendered feed page that the pill reads. */
type Page = {
  fetchedAt: number
  /** See `FeedPageUnselected`. */
  since?: string
  slices: readonly FeedPostSlice[]
}

/**
 * The posts on some pages that the list renders, and their authors with
 * avatars safe to show.
 */
export type PrependOffer = {
  /**
   * How many posts are offered: one per feed item, as a reply's thread
   * context isn't a new post of its own.
   */
  count: number
  /** The posts' authors, distinct and newest first. */
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
 * Counts the posts from `pages` that the list renders, and lists their
 * authors. Rows the list leaves out, such as muted authors', don't count; nor
 * do saved-feed samples, which `pages` lack, or gap rows.
 */
export function getPrependOffer(
  rows: readonly Row[],
  pages: readonly Page[],
): PrependOffer {
  const slices = new Set(pages.flatMap(page => page.slices))
  const counted = new Set<FeedPostSlice>()
  const authors: NewPostsPillAuthor[] = []
  for (const row of rows) {
    if (
      row.type !== 'sliceItem' ||
      !row.slice ||
      !slices.has(row.slice) ||
      counted.has(row.slice)
    ) {
      continue
    }
    counted.add(row.slice)
    const face = faceOf(row.slice)
    if (face && !authors.some(author => author.did === face.did)) {
      authors.push(face)
    }
  }
  return {count: counted.size, authors}
}

/**
 * The new posts pill for posts a view's prepends staged above the reader (see
 * `usePostFeedPrepend`). It outlives staging: reading a staged page unstages
 * it, but the pill stays up until `dismiss`, which the caller calls when the
 * reader reaches the true top.
 *
 * An offered page (see `StagedPage`) puts it up once its rows render. While
 * it's up, every later staged page joins it, offered or not. Pages are matched
 * by `since`, so a replacement takes its predecessor's place. It counts its
 * posts that still render; its faces are taken as each page joins and only
 * drop out after that. It comes down on `dismiss`, on press, and once none of
 * its posts render, and shows only while the view is active.
 *
 * Pressing it scrolls up to the top, without fetching. Already at the top,
 * where there's no scroll to report reaching it, `onRead` reads the page.
 */
export function usePrependPill({
  enabled,
  isActive,
  staged,
  rows,
  pages,
  offsetY,
  scrollToTop,
  onRead,
}: {
  /** Whether the view offers prepended posts at all. */
  enabled: boolean
  /** Whether the view is the one on screen. */
  isActive: boolean
  /** The page the view's prepends staged on top, if any. */
  staged: StagedPage | undefined
  /** The rows the list renders. */
  rows: readonly Row[]
  /** The feed's pages as they render, without saved-feed samples. */
  pages: readonly Page[] | undefined
  /** The list's scroll offset. */
  offsetY: {get(): number}
  /** Scrolls the list to its true top. */
  scrollToTop: () => void
  /** Reads the staged page. */
  onRead: () => void
}) {
  const [{takenAt, offer, down}, setPill] = useState<{
    /**
     * The last staged page the pill took in, by `fetchedAt`. Once dismissed, an
     * offer of the same page doesn't put it back up: at most once per page.
     */
    takenAt?: number
    /**
     * Set while it's up: the `since` of each of its pages, its faces, and what
     * put it up.
     */
    offer?: {
      sinces: string[]
      authors: NewPostsPillAuthor[]
      source: PrependPillSource
    }
    /** What put the last offer up, and why it came down. */
    down?: {source: PrependPillSource; reason: PrependPillHideReason}
  }>({})

  const top = pages?.[0]
  // A page's rows render after it commits, which may be after it's staged.
  const page = staged && top?.fetchedAt === staged.fetchedAt ? top : undefined
  // An offered page puts it up, and while it's up, any staged page joins it.
  const source = offer?.source ?? staged?.offeredBy
  const takesIn =
    enabled &&
    page !== undefined &&
    page.fetchedAt !== takenAt &&
    source !== undefined
  const sinces =
    takesIn && page.since !== undefined && !offer?.sinces.includes(page.since)
      ? [...(offer?.sinces ?? []), page.since]
      : (offer?.sinces ?? [])
  const ownPages =
    pages?.filter(({since}) => since !== undefined && sinces.includes(since)) ??
    []
  // Down with nothing to take in, as on other feeds, it skips the rows.
  const live = takesIn || offer ? getPrependOffer(rows, ownPages) : NO_OFFER
  // Why it comes down once none of its posts render.
  const goneDown = offer && {
    source: offer.source,
    reason: ownPages.length ? ('gone' as const) : ('replaced' as const),
  }
  if (takesIn) {
    setPill(
      live.count
        ? {
            takenAt: page.fetchedAt,
            offer: {sinces, authors: live.authors.slice(0, FACE_LIMIT), source},
          }
        : {takenAt: page.fetchedAt, down: goneDown ?? down},
    )
  } else if (offer && !live.count) {
    setPill({takenAt, down: goneDown})
  }

  const hide = (reason: PrependPillHideReason) => {
    setPill(pill =>
      pill.offer
        ? {takenAt: pill.takenAt, down: {source: pill.offer.source, reason}}
        : pill,
    )
  }

  const isUp = enabled && offer !== undefined && live.count > 0
  return {
    /**
     * Whether an offer is up, even while the view is inactive and it isn't
     * `visible`.
     */
    isUp,
    visible: isUp && isActive,
    // Hits 0 as it hides, which NewPostsPill covers by keeping what it showed.
    count: live.count,
    authors:
      offer?.authors.filter(author =>
        live.authors.some(face => face.did === author.did),
      ) ?? [],
    /** What put the offer up, or the last one while none is. For metrics. */
    source: offer?.source ?? down?.source,
    /** Why the last offer came down, while none is up. For metrics. */
    hideReason: offer ? undefined : down?.reason,
    /** Takes the pill down, as when the reader reaches the true top. */
    dismiss: () => hide('reachedTop'),
    onPress: () => {
      hide('pressed')
      if (offsetY.get() <= SETTLE_AT_TOP_LIMIT) {
        onRead()
      }
      scrollToTop()
    },
  }
}
