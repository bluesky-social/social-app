import {useMemo} from 'react'
import {type AppBskyUnspeccedGetTrends, hasMutedWord} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'

export const DEFAULT_LIMIT = 5

export const createGetTrendsQueryKey = () => ['trends']

const PUBLIC_API = 'https://api.blacksky.community'

export function useGetTrendsQuery() {
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
      const params = new URLSearchParams({limit: String(DEFAULT_LIMIT)})
      const res = await fetch(
        `${PUBLIC_API}/xrpc/app.bsky.unspecced.getTrends?${params}`,
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )
      if (!res.ok) {
        throw new Error(`getTrends failed: ${res.status}`)
      }
      const data = (await res.json()) as AppBskyUnspeccedGetTrends.OutputSchema
      return data
    },
    select(data: AppBskyUnspeccedGetTrends.OutputSchema) {
      return {
        trends: (data.trends ?? []).filter(t => {
          return !hasMutedWord({
            mutedWords,
            text: t.topic + ' ' + t.displayName + ' ' + t.category,
          })
        }),
      }
    },
  })
}
