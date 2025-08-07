import React from 'react'
import {type AppGndrUnspeccedGetTrends} from '@gander-social-atproto/api'
import {hasMutedWord} from '@gander-social-atproto/api/dist/moderation/mutewords'
import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createGndrTopicsHeader,
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
    staleTime: STALE.MINUTES.THREE,
    queryKey: createGetTrendsQueryKey(),
    queryFn: async () => {
      const contentLangs = getContentLanguages().join(',')
      const {data} = await agent.app.gndr.unspecced.getTrends(
        {
          limit: DEFAULT_LIMIT,
        },
        {
          headers: {
            ...createGndrTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )
      return data
    },
    select: React.useCallback(
      (data: AppGndrUnspeccedGetTrends.OutputSchema) => {
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
