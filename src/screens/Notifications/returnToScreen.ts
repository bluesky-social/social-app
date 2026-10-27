import {useEffect, useEffectEvent, useRef} from 'react'
import {useIsFocused} from '@react-navigation/native'

import {type AnyAppReturn, onAnyAppReturn} from '#/lib/appState'
import {listenPushNotificationOpened} from '#/state/events'
import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped'
import {type Metrics} from '#/analytics'
import {IS_WEB} from '#/env'

export type RefreshReason = Metrics['notifications:refresh']['reason']

/**
 * v1's rule for whether the window is scrolled far enough down the page that
 * refreshing would move content under the user, read straight off
 * `window.scrollY` rather than any tracked scroll state. Web only; see
 * `useReturnToScreen`'s web focus effect.
 */
const WEB_NEAR_TOP_SCROLL_Y = 200

/**
 * Coming back to the screen: focusing it again, mounting it (its first
 * visit, or a remount - on web, after being popped off the stack by
 * navigating to a route below it, e.g. the left nav or bottom bar's
 * `{pop: true}`, or after `WEB_MAX_CACHED_SCREENS` eviction), or, while it's
 * open, a significant return to the app or opening a push. Each one checks
 * the tab in view for anything new, with `checkLatest`.
 *
 * On web, an app or browser-tab return (`onAnyAppReturn`) only ever peeks
 * with `peekLatest`, however long it was away: v1 had no hook for this at
 * all, and following v2's Home does the same on its own return. Native keeps
 * refreshing on a significant return, which is a separate decision.
 *
 * As in v1, coming back from a screen pushed within the Notifications tab
 * (e.g. a post) refreshes too, unless the user is partway down the list. So
 * what was tinted before is cleared, having been seen.
 */
export function useReturnToScreen({
  activeFeed,
  checkLatest,
  peekLatest,
  scrolledDownFeeds,
}: {
  activeFeed: React.RefObject<GroupedNotificationsFeed>
  checkLatest: (
    feed: GroupedNotificationsFeed,
    reason: RefreshReason,
    options?: {
      /**
       * Overrides the List's own tracked scroll state; see the web focus
       * effect below.
       */
      isScrolledDown?: boolean
    },
  ) => void
  /**
   * Asks the server for anything new in a feed without loading it, which
   * offers the "Refresh" pill if there is.
   */
  peekLatest: (feed: GroupedNotificationsFeed) => void
  /**
   * The List's own view of which tabs are scrolled down (see
   * `onScrolledDownChange` in the screen). Read by `checkLatest` as the
   * default on native. On web, the focus effect below measures the real
   * window position itself instead, and keeps this in sync with it, since
   * this starts empty after a remount and can't be trusted there.
   */
  scrolledDownFeeds: React.RefObject<Set<GroupedNotificationsFeed>>
}) {
  const isFocused = useIsFocused()

  const onReturn = useEffectEvent((reason: RefreshReason) => {
    checkLatest(activeFeed.current, reason)
  })

  const onFocusReturn = useEffectEvent(() => {
    if (!IS_WEB) {
      checkLatest(activeFeed.current, 'focus')
      return
    }
    /*
     * On web, `useWebScrollRestoration` puts the window back to this route's
     * saved offset, from a `requestAnimationFrame` it schedules in its own
     * `focus` listener on the navigator (passed in as that navigator's
     * `screenListeners`). Reading `window.scrollY` straight away in this
     * effect would see wherever the previous screen left it, not the
     * restored position, because React fires child effects (this one, on the
     * screen) before parent effects (the navigator's, which is what emits
     * `focus` and runs the restoring listener) - so the restoring
     * `requestAnimationFrame` is always scheduled after this effect runs.
     *
     * A single `requestAnimationFrame` here wouldn't help either: since it's
     * scheduled first, it would still run before the restoring one on the
     * very next frame. Nesting a second one works, because by the time it
     * runs (a frame later), the restoring `requestAnimationFrame` - which
     * runs in between, on the first frame - has already called
     * `window.scrollTo`, which applies synchronously.
     *
     * This also covers a remount - after being popped off the stack by
     * navigating to a route below it (e.g. Home, when the session started
     * there), or after `WEB_MAX_CACHED_SCREENS` eviction - where the restored
     * offset can be mid-list, and `scrolledDownFeeds` starts empty, so it
     * can't be used to tell.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const feed = activeFeed.current
        const isScrolledDown = window.scrollY > WEB_NEAR_TOP_SCROLL_Y
        if (isScrolledDown) {
          scrolledDownFeeds.current.add(feed)
        } else {
          scrolledDownFeeds.current.delete(feed)
        }
        checkLatest(feed, 'focus', {isScrolledDown})
      })
    })
  })

  // Mounting counts, as the cache can outlive the screen
  const wasFocused = useRef(false)
  useEffect(() => {
    if (isFocused && !wasFocused.current) {
      onFocusReturn()
    }
    wasFocused.current = isFocused
  }, [isFocused])

  const onLeftApp = useEffectEvent(
    (reason: 'significantReturn' | 'pushOpened') => {
      if (isFocused) {
        onReturn(reason)
      }
    },
  )
  const onAppReturn = useEffectEvent((appReturn: AnyAppReturn) => {
    if (IS_WEB) {
      // Every return just peeks on web, however long it was away; see above.
      if (isFocused) peekLatest(activeFeed.current)
      return
    }
    if (appReturn.isSignificant) {
      onLeftApp('significantReturn')
    } else if (isFocused) {
      peekLatest(activeFeed.current)
    }
  })
  useEffect(() => {
    const returns = onAnyAppReturn(appReturn => onAppReturn(appReturn))
    /*
     * Opening a push leaves the app too, even when it never went to the
     * background, e.g. from Notification Center on iOS.
     */
    const unlistenPush = listenPushNotificationOpened(() =>
      onLeftApp('pushOpened'),
    )
    return () => {
      returns.remove()
      unlistenPush()
    }
  }, [])
}
