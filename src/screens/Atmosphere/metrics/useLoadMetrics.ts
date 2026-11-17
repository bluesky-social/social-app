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
  /** Whether the query has any data, even if a later fetch failed. */
  hasData: boolean
  isError: boolean
  itemCount: number
}) {
  const ax = useAnalytics()
  const {scope} = useAtmosphereMetricsSnapshot()
  const context = scope && {tab: scope.tab, surface: scope.surface}
  const isActive = !!scope?.isActive
  const shown = useRef<{at: number; hadData: boolean} | 'logged'>(undefined)

  useEffect(() => {
    if (!context || shown.current === 'logged') return
    if (!shown.current) {
      if (!isActive) return
      shown.current = {at: Date.now(), hadData: hasData}
    }
    if (!hasData && !isError) return
    ax.metric('atmosphere:content:loaded', {
      ...context,
      state: !hasData ? 'error' : itemCount ? 'populated' : 'empty',
      itemCount,
      durationMs: Date.now() - shown.current.at,
      hasCachedData: shown.current.hadData,
    })
    shown.current = 'logged'
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
