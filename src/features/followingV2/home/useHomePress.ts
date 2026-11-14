import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isAtTop} from './atTop'
import {type usePostFeedPrepend} from './queries/postFeed'
import {type useRevealTop} from './useRevealTop'

/**
 * Handles Home on an anchored feed. Below the top, scrolls up through what's
 * loaded without fetching. At the top, marks the staged page read and prepends
 * what's newer (or refreshes if there's no cursor to prepend from), then jumps
 * to the new posts if the reader is still at the top. Returns false when
 * disabled.
 */
export function useHomePress({
  enabled,
  offsetY,
  prepend,
  revealTop,
  refresh,
  onHasNew,
  onFetch,
}: {
  /** Whether the feed stages new posts above the reader. */
  enabled: boolean
  offsetY: {get(): number}
  prepend: Pick<
    ReturnType<typeof usePostFeedPrepend>,
    'run' | 'isOwed' | 'markRead'
  >
  revealTop: ReturnType<typeof useRevealTop>
  /** Refreshes the feed from the top, resolving to the page it wrote, if any. */
  refresh: () => Promise<{fetchedAt: number} | undefined>
  /** Sets the Home dot. */
  onHasNew?: (hasNew: boolean) => void
  /**
   * Called when a press at the top asks for newer posts, to log the refresh
   * metric. Like the page's own press, it counts one that joins a fetch.
   */
  onFetch?: () => void
}) {
  return useNonReactiveCallback((): boolean => {
    const atTop = () => isAtTop(offsetY.get())
    if (!enabled) {
      return false
    }
    if (!atTop()) {
      revealTop.reveal()
      return true
    }
    onFetch?.()
    /*
     * Read before `run`, so it fetches above what's staged. Reading it now
     * would make a prepend that's replacing it drop its result.
     */
    if (!prepend.isOwed()) {
      prepend.markRead()
    }
    // isAtTop allows a few points of slack; close it.
    revealTop.reveal()
    // 'focus' as the pill doesn't offer it; the press shows what it finds.
    const prepending = prepend.run('focus')
    if (!prepending) {
      void refresh().then(page => {
        if (page) {
          onHasNew?.(false)
        }
      })
      return true
    }
    void prepending.then(
      page => {
        if (!atTop()) {
          return
        }
        if (page) {
          // The jump waits for the page to render, so checks the top again.
          revealTop.onceRendered(page.fetchedAt, atTop)
        } else {
          onHasNew?.(false)
        }
      },
      e => {
        if (!isNetworkError(e)) {
          logger.error('Failed to fetch newer posts on a press of Home', {
            safeMessage: e,
          })
        }
      },
    )
    return true
  })
}
