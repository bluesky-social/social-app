import {useState} from 'react'

import {type NewPostsPillAuthor} from '#/components/NewPostsPill'
import {type FeedPostSlice, type StagedPage} from './queries/postFeed'
import {SETTLE_AT_TOP_LIMIT} from './useSettleAtTop'

/** How many faces the pill shows. */
const FACE_LIMIT = 3

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
 * What some pages offer, as the list renders them: their posts, and the
 * authors of those posts whose avatars are safe to show.
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
 * What `pages` offer, as the list renders them: the post rows from those
 * pages. Rows the list leaves out, such as muted authors', aren't offered.
 * Neither are saved-feed samples, as `pages` are without them, nor gap rows.
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
 * The new posts pill for the posts a view's prepends staged above the reader
 * (see `usePostFeedPrepend`). It keeps its own time, apart from staging:
 * reading a staged page unstages it, so the next prepend goes above it, but
 * the pill stays up until the reader reaches the true top.
 *
 * It goes up on an offer (see `StagedPage`), once the offered page renders.
 * While it's up, every page staged later joins it, whatever staged it. It
 * knows its pages by the `since` each was fetched from, so a page that
 * replaces one, fetched from the same place, takes its place. It counts the
 * posts on its pages that still render (see {@link getPrependOffer}). Its
 * faces are the first {@link FACE_LIMIT} as each page joins, and only drop out
 * after that, as a deletion, a mute or a block can take a post away and a
 * label can make an avatar unsafe.
 *
 * It comes down when the reader reaches the true top (`dismiss`), when they
 * press it, and once none of its posts render, as when a refresh replaces the
 * feed. It goes up at most once for each staged page, however often that's
 * offered. It shows only while the view is active, which includes a view that
 * prepended in the background becoming active.
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
  const [{takenAt, offer}, setPill] = useState<{
    /** The last staged page the pill took in, by `fetchedAt`. */
    takenAt?: number
    /**
     * While it's up, its pages, by the `since` each was fetched from, and its
     * faces.
     */
    offer?: {sinces: string[]; authors: NewPostsPillAuthor[]}
  }>({})

  const top = pages?.[0]
  // A page's rows render after it commits, which may be after it's staged.
  const page = staged && top?.fetchedAt === staged.fetchedAt ? top : undefined
  // An offered page puts it up, and while it's up, any staged page joins it.
  const takesIn =
    enabled &&
    page !== undefined &&
    page.fetchedAt !== takenAt &&
    (!!staged?.offered || offer !== undefined)
  const sinces =
    takesIn && page.since !== undefined && !offer?.sinces.includes(page.since)
      ? [...(offer?.sinces ?? []), page.since]
      : (offer?.sinces ?? [])
  const live = getPrependOffer(
    rows,
    pages?.filter(({since}) => since !== undefined && sinces.includes(since)) ??
      [],
  )
  if (takesIn) {
    setPill({
      takenAt: page.fetchedAt,
      offer: live.count
        ? {sinces, authors: live.authors.slice(0, FACE_LIMIT)}
        : undefined,
    })
  } else if (offer && !live.count) {
    // None of its posts render any more, as once a refresh replaces them.
    setPill({takenAt})
  }

  const dismiss = () => {
    setPill(pill => (pill.offer ? {takenAt: pill.takenAt} : pill))
  }

  return {
    visible: enabled && isActive && offer !== undefined && live.count > 0,
    count: live.count,
    authors:
      offer?.authors.filter(author =>
        live.authors.some(face => face.did === author.did),
      ) ?? [],
    /** Takes the pill down, as once the reader reaches the true top. */
    dismiss,
    onPress: () => {
      dismiss()
      if (offsetY.get() <= SETTLE_AT_TOP_LIMIT) {
        onRead()
      }
      scrollToTop()
    },
  }
}
