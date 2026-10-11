import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type FeedAPI} from './api/types'
import {
  type FeedDescriptor,
  type FeedPage,
  type FeedParams,
  type FeedPostSlice,
  hasUnseenPosts,
  pollLatest,
  type usePostFeedPrepend,
} from './queries/postFeed'
import {type NewPostsCheckTrigger} from './useNewPostsCheck'
import {useSettleAtTop} from './useSettleAtTop'
import {type ListScrollReports} from './useSettleScrollHandlers'

type Prepend = ReturnType<typeof usePostFeedPrepend>
type SettleAtTopOptions = Parameters<typeof useSettleAtTop>[2]

/** The parts of a feed row that tell whether it's from the top page. */
type Row = {type: string; slice?: FeedPostSlice; cursor?: string}

/**
 * Anchored Following's check for new posts (see `useNewPostsCheck`): it
 * stages what's newer above the reader and lights the Home dot if any of it
 * would show. With nothing to fetch above, as for an empty feed, it peeks.
 */
export async function checkFollowing(
  trigger: NewPostsCheckTrigger,
  {
    prepend,
    top,
    createFeedApi,
    onHasNew,
  }: {
    prepend: Pick<Prepend, 'check'>
    /** The feed's top page, without saved-feed samples. */
    top: FeedPage | undefined
    createFeedApi: () => FeedAPI
    /** Lights the Home dot. */
    onHasNew?: (hasNew: boolean) => void
  },
) {
  const staging = prepend.check(trigger)
  if (!staging) {
    return pollLatest(top, createFeedApi())
  }
  const page = await staging
  if (page && hasUnseenPosts(top, page.feed)) {
    onHasNew?.(true)
  }
  return undefined
}

/**
 * What anchored Following does with its list's reports (see
 * `useSettleScrollHandlers`) and with each row the reader sees.
 */
export function useFollowingListReports(
  feed: FeedDescriptor,
  params: FeedParams | undefined,
  {
    enabled,
    prepend,
    top,
    pill,
    onHasNew,
    onSettled,
  }: {
    /** Whether the feed settles at the top (see `useSettleAtTop`). */
    enabled: boolean
    prepend: Pick<Prepend, 'staged' | 'markRead' | 'onBeginDrag' | 'onPageSeen'>
    /** The feed's top page as it renders. */
    top: FeedPage | undefined
    /** The new posts pill (see `usePrependPill`). */
    pill: {dismiss: () => void}
    /** Puts the Home dot out. */
    onHasNew?: (hasNew: boolean) => void
    onSettled?: SettleAtTopOptions['onSettled']
  },
): {reports: ListScrollReports; onRowSeen: (row: Row) => void} {
  const settleAtTop = useSettleAtTop(feed, params, {
    enabled,
    // At the newest post, nothing is new to the reader any more.
    onRestAtTop: () => {
      onHasNew?.(false)
      pill.dismiss()
    },
    onSettled,
  })
  const onRowSeen = useNonReactiveCallback((row: Row) => {
    if (
      prepend.staged &&
      top &&
      ((row.type === 'sliceItem' &&
        !!row.slice &&
        top.slices.includes(row.slice)) ||
        (row.type === 'gap' && row.cursor === top.cursor))
    ) {
      prepend.onPageSeen(top.fetchedAt)
    }
  })
  return {
    reports: {
      ...settleAtTop,
      onBeginDrag: () => {
        settleAtTop.onBeginDrag()
        prepend.onBeginDrag()
      },
      // At the top, the reader has passed everything staged above them.
      onReachTop: () => {
        prepend.markRead()
        pill.dismiss()
      },
    },
    onRowSeen,
  }
}
