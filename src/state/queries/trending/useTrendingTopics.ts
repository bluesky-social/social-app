import React from 'react'
import {hasMutedWord} from '@atproto/api/dist/moderation/mutewords'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

const HOST = ``
const TOKEN = ``

export type TrendingTopic = {
  topic: string
  displayName: string
  description: string
  link: string
}

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
    staleTime: STALE.MINUTES.THIRTY,
    queryKey: trendingTopicsQueryKey,
    async queryFn() {
      const params = new URLSearchParams()
      params.set('viewer', agent.session?.did || '')
      params.set('limit', String(DEFAULT_LIMIT))
      const res = await fetch(`${HOST}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch trending topics')
      }

      const {topics, recommended} = (await res.json()) as {
        topics: TrendingTopic[]
        recommended: TrendingTopic[]
      }
      return {
        topics: topics.filter(t => {
          return !hasMutedWord({
            mutedWords,
            text: t.topic + ' ' + t.displayName + ' ' + t.description,
          })
        }),
        recommended: recommended.filter(t => {
          return !hasMutedWord({
            mutedWords,
            text: t.topic + ' ' + t.displayName + ' ' + t.description,
          })
        }),
      }
    },
  })
}
