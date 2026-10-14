import {useEffect, useEffectEvent, useRef} from 'react'

import {useAppState} from '#/lib/appState'
import {
  type GroupedNotificationsFeed,
  type LoadedGroupedNotificationsPage,
} from '#/state/queries/notifications/grouped'
import {type AnalyticsContextType, type Metrics} from '#/analytics'

/*
 * Metrics for the "Refresh" pill on a Notifications tab (see `RefreshPill`):
 * when it shows, when it's pressed, and why it goes, named and shaped like
 * Following's new posts pill. Counts, durations and enums only, never the
 * notifications or who they're from.
 */

/**
 * Why the pill went, after it showed.
 */
export type RefreshPillHideReason =
  Metrics['notifications:refreshPill:hide']['reason']

/**
 * How long the pill has to stay up to count. One that goes sooner was never
 * really seen, e.g. one still up from before the app went to the background,
 * which the refresh on coming back takes down straight away.
 */
export const IMPRESSION_DELAY_MS = 250

/**
 * Why the pill went without the user pressing it: `left` if the tab is out of
 * view, `refreshed` if the tab is fetching its first page or has fetched it
 * again since the pill showed, otherwise `gone`.
 */
export function refreshPillHideReason({
  isInView,
  isFetchingTop,
  topRequestedAt,
  shownTopRequestedAt,
}: {
  isInView: boolean
  isFetchingTop: boolean
  /**
   * When the tab's first page was requested, if it has one.
   */
  topRequestedAt: number | undefined
  /**
   * When the tab's first page was requested, as the pill showed.
   */
  shownTopRequestedAt: number
}): RefreshPillHideReason {
  if (!isInView) return 'left'
  if (
    isFetchingTop ||
    (topRequestedAt !== undefined && topRequestedAt > shownTopRequestedAt)
  ) {
    return 'refreshed'
  }
  return 'gone'
}

/**
 * The pill from showing to going.
 */
type Showing = {
  /** When it showed. */
  shownAt: number
  /** When the tab's first page was requested, as it showed. */
  topRequestedAt: number
  /** Whether the user has pressed it. */
  isPressed: boolean
  /** Whether its impression has been reported. */
  isCounted: boolean
  /** Reports its impression once it has stayed up long enough. */
  timer: ReturnType<typeof setTimeout>
}

/**
 * Reports the "Refresh" pill's impressions, presses and hides on one tab, and
 * returns `onPress` wrapped to report presses.
 *
 * An impression is each time the pill comes into view and stays up for
 * `IMPRESSION_DELAY_MS`, or is pressed sooner. It's only in view while the tab
 * is the one in view, on the focused screen, with the app in the foreground.
 * Every impression ends in one hide, so a pill that's still up when the user
 * comes back to the tab counts again, and one that goes before it counts
 * reports nothing.
 */
export function useRefreshPillMetrics({
  metric,
  tab,
  isInView,
  visible,
  top,
  isFetchingTop,
  onPress,
}: {
  metric: AnalyticsContextType['metric']
  tab: GroupedNotificationsFeed
  /**
   * Whether the tab is the one in view, on the focused screen.
   */
  isInView: boolean
  /**
   * Whether the pill is up, which it only is while `isInView`.
   */
  visible: boolean
  /**
   * The tab's first page, once loaded.
   */
  top: Pick<LoadedGroupedNotificationsPage, 'requestedAt'> | undefined
  /**
   * Whether the tab is fetching its first page, rather than a later one.
   */
  isFetchingTop: boolean
  onPress: () => void
}): () => void {
  const isForeground = useAppState() !== 'background'
  const isShown = visible && isForeground
  const showing = useRef<Showing>(undefined)
  const topRequestedAt = top?.requestedAt

  const count = (current: Showing) => {
    if (current.isCounted) return
    clearTimeout(current.timer)
    current.isCounted = true
    metric('notifications:refreshPill:impression', {tab})
  }

  /**
   * Ends a showing, reporting its hide if it was counted.
   */
  const end = (current: Showing, reason: RefreshPillHideReason) => {
    showing.current = undefined
    clearTimeout(current.timer)
    if (!current.isCounted) return
    metric('notifications:refreshPill:hide', {
      tab,
      reason: current.isPressed ? 'pressed' : reason,
      shownMs: Date.now() - current.shownAt,
    })
  }

  useEffect(() => {
    const current = showing.current
    if (isShown && !current && topRequestedAt !== undefined) {
      const next: Showing = {
        shownAt: Date.now(),
        topRequestedAt,
        isPressed: false,
        isCounted: false,
        timer: setTimeout(() => count(next), IMPRESSION_DELAY_MS),
      }
      showing.current = next
    } else if (!isShown && current) {
      end(
        current,
        refreshPillHideReason({
          isInView: isInView && isForeground,
          isFetchingTop,
          topRequestedAt,
          shownTopRequestedAt: current.topRequestedAt,
        }),
      )
    }
  }, [
    count,
    end,
    isShown,
    isInView,
    isForeground,
    isFetchingTop,
    topRequestedAt,
  ])

  /*
   * The tab's effects going ends a showing too: when the screen closes, and
   * on web, when the user switches away from the tab, which hides it.
   */
  const onEffectsGone = useEffectEvent(() => {
    const current = showing.current
    if (current) {
      end(current, 'left')
    }
  })
  useEffect(() => {
    return () => onEffectsGone()
  }, [])

  return () => {
    const current = showing.current
    if (current) {
      // Pressed before it counted, so it was seen after all
      count(current)
      current.isPressed = true
      metric('notifications:refreshPill:press', {
        tab,
        shownMs: Date.now() - current.shownAt,
      })
    }
    onPress()
  }
}
