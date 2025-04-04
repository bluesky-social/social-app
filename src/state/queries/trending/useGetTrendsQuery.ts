import React from 'react'
import {type AppBskyUnspeccedGetTrends} from '@atproto/api'
import {hasMutedWord} from '@atproto/api/dist/moderation/mutewords'
import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export const DEFAULT_LIMIT = 5

export const createGetTrendsQueryKey = () => ['trends']

export function useGetTrendsQuery() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const mutedWords = React.useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery({
    enabled: !!preferences,
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetTrendsQueryKey(),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const {data} = await agent.app.bsky.unspecced.getTrends(
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
      return data
    },
    select: React.useCallback(
      (data: AppBskyUnspeccedGetTrends.OutputSchema) => {
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
