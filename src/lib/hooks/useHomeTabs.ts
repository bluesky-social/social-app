import {useEffect, useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {
  getFeedTypeFromUri,
  hydrateFeedGenerator,
  hydrateList,
  useFeedSourceInfoQueryKey as feedSourceInfoQueryKey,
  FeedSourceInfo,
} from '#/state/queries/feed'

export function useHomeTabs(): string[] {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  const [tabs, setTabs] = useState<string[]>(['Following'])
  const {data: preferences} = usePreferencesQuery()
  const pinnedFeedsKey = JSON.stringify(preferences?.feeds?.pinned)

  useEffect(() => {
    if (!preferences?.feeds?.pinned) return
    const uris = preferences.feeds.pinned

    async function fetchFeedInfo() {
      const reqs = []

      for (const uri of uris) {
        const cached = queryClient.getQueryData<FeedSourceInfo>(
          feedSourceInfoQueryKey({uri}),
        )

        if (cached) {
          reqs.push(cached)
        } else {
          const type = getFeedTypeFromUri(uri)

          if (type === 'feed') {
            reqs.push(
              (async () => {
                const res = await agent.app.bsky.feed.getFeedGenerator({
                  feed: uri,
                })
                return hydrateFeedGenerator(res.data.view)
              })(),
            )
          } else {
            reqs.push(
              (async () => {
                const res = await agent.app.bsky.graph.getList({
                  list: uri,
                  limit: 1,
                })
                return hydrateList(res.data.list)
              })(),
            )
          }
        }
      }

      const views = await Promise.all(reqs)

      setTabs(['Following'].concat(views.map(v => v.displayName)))
    }

    fetchFeedInfo()
  }, [
    agent,
    queryClient,
    setTabs,
    preferences?.feeds?.pinned,
    // ensure we react to re-ordering
    pinnedFeedsKey,
  ])

  return tabs
}
