import React from 'react'
import {AppBskyUnspeccedDefs} from '@atproto/api'
import {hasMutedWord} from '@atproto/api/dist/moderation/mutewords'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export type TrendingTopic = AppBskyUnspeccedDefs.TrendingTopic

export const DEFAULT_LIMIT = 14

export const trendingTopicsQueryKey = ['trending-topics']

export function useTrendingTopics() {
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const mutedWords = React.useMemo(() => {
    return preferences?.moderationPrefs?.mutedWords || []
  }, [preferences?.moderationPrefs])

  return useQuery({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.THREE,
    queryKey: trendingTopicsQueryKey,
    async queryFn() {
      const {data} = await agent.api.app.bsky.unspecced.getTrendingTopics({
        limit: DEFAULT_LIMIT,
      })

      const {topics, suggested} = data
      return {
        topics: topics.filter(t => {
          return !hasMutedWord({
            mutedWords,
            text: t.topic + ' ' + t.displayName + ' ' + t.description,
          })
        }),
        suggested: suggested.filter(t => {
          return !hasMutedWord({
            mutedWords,
            text: t.topic + ' ' + t.displayName + ' ' + t.description,
          })
        }),
      }
    },
  })
}
