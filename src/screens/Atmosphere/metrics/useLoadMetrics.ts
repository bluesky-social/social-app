import {useEffect, useRef} from 'react'

import {useAnalytics} from '#/analytics'
import {useAtmosphereMetricsSnapshot} from './context'

/**
 * Logs the load health of a tab or activity list: its first load, and the
 * user's refreshes and further pages. Logs nothing outside a scope.
 */
export function useLoadMetrics({
  hasData,
  isError,
  itemCount,
  pages,
}: {
  /**
   * Whether the query has data ready to show, even if a later fetch failed.
   * Leave false until anything needed to count the items, like moderation
   * options, is ready too.
   */
  hasData: boolean
  isError: boolean
  itemCount: number
  /** Selected pagination pages; omit for non-paginated tabs. */
  pages?: readonly (readonly unknown[])[]
}) {
  const ax = useAnalytics()
  const {scope} = useAtmosphereMetricsSnapshot()
  const context = scope && {tab: scope.tab, surface: scope.surface}
  const isActive = !!scope?.isActive
  const logged = useRef(false)
  const pageCount = useRef(pages?.length ?? 0)

  useEffect(() => {
    if (!context || !isActive || logged.current) return
    if (!hasData && !isError) return

    ax.metric('atmosphere:content:loaded', {
      ...context,
      state: !hasData ? 'error' : itemCount ? 'populated' : 'empty',
      itemCount,
    })
    logged.current = true
  })

  /*
   * Observe page growth, not fetch promises: overlapping or cancelled callers
   * can resolve successfully with the same pages. Refetches do not add pages.
   */
  useEffect(() => {
    const previousPageCount = pageCount.current
    pageCount.current = pages?.length ?? 0
    if (
      !context ||
      !pages ||
      previousPageCount === 0 ||
      pages.length <= previousPageCount
    ) {
      return
    }

    let totalItemCount = 0
    for (const [pageIndex, page] of pages.entries()) {
      totalItemCount += page.length
      if (pageIndex >= previousPageCount) {
        ax.metric('atmosphere:list:pageLoaded', {
          ...context,
          pageIndex,
          itemCount: page.length,
          totalItemCount,
        })
      }
    }
  })

  return {
    logRefresh() {
      if (context) ax.metric('atmosphere:content:refresh', context)
    },
  }
}
