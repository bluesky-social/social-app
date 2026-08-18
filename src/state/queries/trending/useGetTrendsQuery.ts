import {useCallback, useMemo} from 'react'
import {hasMutedWord} from '@bsky/sdk/moderation'
import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {logger} from '#/logger'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export const DEFAULT_LIMIT = 5

type QueryProps = {
  limit?: number
  refetchOnWindowFocus?: boolean
}

function dedupe<T extends {link: string}>(trends: T[]): T[] {
  const seen = new Set<string>()
  return trends.filter(trend => {
    if (seen.has(trend.link)) return false
    seen.add(trend.link)
    return true
  })
}

export const createGetTrendsQueryKey = (limit?: number) =>
  limit === undefined ? ['trends'] : ['trends', {limit}]

export function useGetTrendsQuery(props: QueryProps = {}) {
  const client = useAppviewClient()
  const {data: preferences} = usePreferencesQuery()
  const limit = props.limit ?? DEFAULT_LIMIT
  const mutedWords = useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery({
    enabled: !!preferences,
    refetchOnWindowFocus: props.refetchOnWindowFocus,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetTrendsQueryKey(limit),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const data = await client.call(
        app.bsky.unspecced.getTrends,
        {
          limit,
        },
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )
      if (!data.recIdStr) {
        logger.debug('useGetTrendsQuery response missing recIdStr')
      }
      return data
    },
    select: useCallback(
      (data: app.bsky.unspecced.getTrends.$OutputBody) => {
        return {
          recId: data.recIdStr,
          trends: dedupe(
            (data.trends ?? []).filter(t => {
              return !hasMutedWord({
                mutedWords,
                text: `${t.topic} ${t.displayName} ${t.category}`,
              })
            }),
          ),
        }
      },
      [mutedWords],
    ),
  })
}
