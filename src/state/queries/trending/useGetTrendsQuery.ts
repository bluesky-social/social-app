import {useCallback, useMemo} from 'react'
import {hasMutedWord} from '@bsky.app/sdk/moderation'
import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useLexClient} from '#/state/session'
import {app} from '#/lexicons'

export const DEFAULT_LIMIT = 5

export const createGetTrendsQueryKey = () => ['trends']

export function useGetTrendsQuery() {
  const client = useLexClient()
  const {data: preferences} = usePreferencesQuery()
  const mutedWords = useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery({
    enabled: !!preferences,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetTrendsQueryKey(),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      return await client.call(
        app.bsky.unspecced.getTrends,
        {
          limit: DEFAULT_LIMIT,
        },
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )
    },
    select: useCallback(
      (data: app.bsky.unspecced.getTrends.$OutputBody) => {
        return {
          trends: (data.trends ?? []).filter(t => {
            return !hasMutedWord({
              mutedWords,
              text: t.topic + ' ' + t.displayName + ' ' + t.category,
            })
          }),
        }
      },
      [mutedWords],
    ),
  })
}
