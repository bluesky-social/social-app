import {useEffect, useRef} from 'react'

import {useAnalytics} from '#/analytics'
import {useAtmosphereMetricsSnapshot} from './context'

/**
 * Logs the load health of a tab or activity list: its first load, and the
 * user's refreshes, retries and further pages. Logs nothing outside a scope.
 */
export function useLoadMetrics({
  hasData,
  isError,
  itemCount,
}: {
  /**
   * Whether the query has data ready to show, even if a later fetch failed.
   * Leave false until anything needed to count the items, like moderation
   * options, is ready too.
   */
  hasData: boolean
  isError: boolean
  itemCount: number
}) {
  const ax = useAnalytics()
  const {scope} = useAtmosphereMetricsSnapshot()
  const context = scope && {tab: scope.tab, surface: scope.surface}
  const isActive = !!scope?.isActive
  const wait = useRef<
    | {
        /** Time in view before the current stretch */
        waitedMs: number
        /** When the current stretch in view started, if it's in view */
        activeSince?: number
        hadData: boolean
      }
    | 'logged'
  >(undefined)

  useEffect(() => {
    if (!context || wait.current === 'logged') return
    const now = Date.now()
    if (!wait.current) {
      if (!isActive) return
      wait.current = {waitedMs: 0, activeSince: now, hadData: hasData}
    }
    const current = wait.current

    /*
     * Only time in view counts as waiting, and the outcome is logged once
     * the user can see it, so loads that settle while away log on return.
     */
    if (!isActive) {
      if (current.activeSince !== undefined) {
        current.waitedMs += now - current.activeSince
        current.activeSince = undefined
      }
      return
    }
    current.activeSince ??= now
    if (!hasData && !isError) return

    ax.metric('atmosphere:content:loaded', {
      ...context,
      state: !hasData ? 'error' : itemCount ? 'populated' : 'empty',
      itemCount,
      durationMs: current.waitedMs + now - current.activeSince,
      hasCachedData: current.hadData,
    })
    wait.current = 'logged'
  })

  return {
    logRefresh() {
      if (context) ax.metric('atmosphere:content:refresh', context)
    },
    logRetry(phase: 'initial' | 'pagination') {
      if (context) ax.metric('atmosphere:content:retry', {...context, phase})
    },
    /** Call with all pages once another has loaded. */
    logPageLoaded(pages: unknown[][]) {
      if (!context || pages.length < 2) return
      ax.metric('atmosphere:list:pageLoaded', {
        ...context,
        pageIndex: pages.length - 1,
        itemCount: pages[pages.length - 1].length,
        totalItemCount: pages.reduce((total, page) => total + page.length, 0),
      })
    },
  }
}
