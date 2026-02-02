import {createContext, useContext, useMemo} from 'react'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {useOnAppStateChange} from '#/lib/appState'
import {useIsBskyTeam} from '#/lib/hooks/useIsBskyTeam'
import {
  convertBskyAppUrlIfNeeded,
  isBskyCustomFeedUrl,
  makeRecordUri,
} from '#/lib/strings/url-helpers'
import {LIVE_EVENTS_URL} from '#/env'
import {useLiveEventPreferences} from '#/features/liveEvents/preferences'
import {type LiveEventsWorkerResponse} from '#/features/liveEvents/types'
import {useDevMode} from '#/storage/hooks/dev-mode'

const qc = new QueryClient()
const liveEventsQueryKey = ['live-events']

export const DEFAULT_LIVE_EVENTS = {
  feeds: [],
}

async function fetchLiveEvents(): Promise<LiveEventsWorkerResponse | null> {
  try {
    const res = await fetch(`${LIVE_EVENTS_URL}/config`)
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

const Context = createContext<LiveEventsWorkerResponse>(DEFAULT_LIVE_EVENTS)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [isDevMode] = useDevMode()
  const isBskyTeam = useIsBskyTeam()
  const {data, refetch} = useQuery(
    {
      // keep this, prefectching handles initial load
      staleTime: 1000 * 15,
      queryKey: liveEventsQueryKey,
      refetchInterval: 1000 * 60 * 5, // refetch every 5 minutes
      async queryFn() {
        return fetchLiveEvents()
      },
    },
    qc,
  )

  useOnAppStateChange(state => {
    if (state === 'active') refetch()
  })

  const ctx = useMemo(() => {
    if (!data) return DEFAULT_LIVE_EVENTS
    const feeds = data.feeds.filter(f => {
      if (f.preview && !isBskyTeam) return false
      return true
    })
    return {
      ...data,
      // only one at a time for now, unless bsky team and dev mode
      feeds: isBskyTeam && isDevMode ? feeds : feeds.slice(0, 1),
    }
  }, [data, isBskyTeam, isDevMode])

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export async function prefetchLiveEvents() {
  const data = await fetchLiveEvents()
  if (data) {
    qc.setQueryData(liveEventsQueryKey, data)
  }
}

export function useLiveEvents() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('useLiveEventsContext must be used within a Provider')
  }
  return ctx
}

export function useUserPreferencedLiveEvents() {
  const events = useLiveEvents()
  const {data, isLoading} = useLiveEventPreferences()
  if (isLoading) return DEFAULT_LIVE_EVENTS
  const {hideAllFeeds, hiddenFeedIds} = data
  return {
    ...events,
    feeds: hideAllFeeds
      ? []
      : events.feeds.filter(f => {
          const hidden = f?.id ? hiddenFeedIds.includes(f?.id || '') : false
          return !hidden
        }),
  }
}

export function useActiveLiveEventFeedUris() {
  const {feeds} = useLiveEvents()

  return new Set(
    feeds
      // insurance
      .filter(f => isBskyCustomFeedUrl(f.url))
      .map(f => {
        const uri = convertBskyAppUrlIfNeeded(f.url)
        const [_0, did, _1, rkey] = uri.split('/').filter(Boolean)
        const urip = makeRecordUri(did, 'app.bsky.feed.generator', rkey)
        return urip.toString()
      }),
  )
}
