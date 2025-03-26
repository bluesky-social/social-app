import React from 'react'
import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {hasMutedWord} from '@atproto/api/dist/moderation/mutewords'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export type TrendingTopic = AppBskyUnspeccedDefs.TrendingTopic & {
  // TEMP, need @atproto/api release
  postCount: number
  startTime: string
}

type Response = {
  topics?: TrendingTopic[]
  suggested?: TrendingTopic[]
}

export const DEFAULT_LIMIT = 14

export const trendingTopicsQueryKey = ['trending-topics']

export function useTrendingTopics() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const mutedWords = React.useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery<Response>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.THREE,
    queryKey: trendingTopicsQueryKey,
    queryFn: async () => {
      const {data} = await agent.app.bsky.unspecced.getTrendingTopics({
        limit: DEFAULT_LIMIT,
      })
      return data as Response
    },
    select: React.useCallback(
      (data: Response) => {
        return {
          topics: (data.topics ?? []).filter(t => {
            return !hasMutedWord({
              mutedWords,
              text: t.topic + ' ' + t.displayName + ' ' + t.description,
            })
          }),
          suggested: (data.suggested ?? []).filter(t => {
            return !hasMutedWord({
              mutedWords,
              text: t.topic + ' ' + t.displayName + ' ' + t.description,
            })
          }),
        }
      },
      [mutedWords],
    ),
  })
}
