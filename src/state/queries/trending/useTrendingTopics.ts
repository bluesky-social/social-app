import {useCallback, useMemo} from 'react'
import {hasMutedWord} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useLexClient} from '#/state/session'
import {app} from '#/lexicons'

export type TrendingTopic = app.bsky.unspecced.defs.TrendingTopic

type Response = {
  topics: TrendingTopic[]
  suggested: TrendingTopic[]
}

export const DEFAULT_LIMIT = 14

function dedup(topics: TrendingTopic[]): TrendingTopic[] {
  const seen = new Set<string>()
  return topics.filter(t => {
    if (seen.has(t.link)) return false
    seen.add(t.link)
    return true
  })
}

export const trendingTopicsQueryKey = ['trending-topics']

export function useTrendingTopics() {
  const client = useLexClient()
  const {data: preferences} = usePreferencesQuery()
  const mutedWords = useMemo(
    () => preferences?.moderationPrefs?.mutedWords ?? [],
    [preferences?.moderationPrefs?.mutedWords],
  )

  return useQuery<Response>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.THREE,
    queryKey: trendingTopicsQueryKey,
    async queryFn() {
      const data = await client.call(app.bsky.unspecced.getTrendingTopics, {
        limit: DEFAULT_LIMIT,
      })
      return {
        topics: data.topics ?? [],
        suggested: data.suggested ?? [],
      }
    },
    select: useCallback(
      (data: Response) => {
        return {
          topics: dedup(
            data.topics.filter(t => {
              return !hasMutedWord({
                mutedWords,
                text: `${t.topic} ${t.displayName ?? ''} ${t.description ?? ''}`,
              })
            }),
          ),
          suggested: dedup(
            data.suggested.filter(t => {
              return !hasMutedWord({
                mutedWords,
                text: `${t.topic} ${t.displayName ?? ''} ${t.description ?? ''}`,
              })
            }),
          ),
        }
      },
      [mutedWords],
    ),
  })
}
