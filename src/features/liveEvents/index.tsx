import {createContext, useContext} from 'react'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {IS_DEV, LIVE_EVENTS_URL} from '#/env'

type LiveEventFeedImageLayout = 'wide' // maybe more in the future
type LiveEventFeedImage = {
  alt: string
  overlayColor: string
  url: string
  blurhash: string
}
type LiveEventFeed = {
  title: string
  url: string
  images: Partial<Record<LiveEventFeedImageLayout, LiveEventFeedImage>>
}
type LiveEventsConfig = {
  feeds: LiveEventFeed[]
}

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * We clear this manually, so disable automatic garbage collection.
       * @see https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#how-it-works
       */
      gcTime: Infinity,
    },
  },
})

const liveEventsQueryKey = ['live-events']

async function getLiveEvents(): Promise<LiveEventsConfig | null> {
  const res = await fetch(`${LIVE_EVENTS_URL}/config`)
  if (!res.ok) return null
  return res.json()
}

export function getLiveEventsCache() {
  return qc.getQueryData<LiveEventsConfig>(liveEventsQueryKey)
}

export async function prefetchLiveEvents() {
  const data = await getLiveEvents()
  if (data) {
    qc.setQueryData(liveEventsQueryKey, data)
  }
}

export const Context = createContext<LiveEventsConfig>({
  feeds: [],
})

export function useLiveEventsContext() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('useLiveEventsContext must be used within a Provider')
  }
  return ctx
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {data} = useQuery(
    {
      /**
       * Will re-fetch when stale, at most every minute (or 5s in dev for easier
       * testing).
       *
       * @see https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data#initial-data-from-the-cache-with-initialdataupdatedat
       */
      staleTime: IS_DEV ? 5e3 : 1000 * 60,
      /**
       * N.B. if prefetch failed above, we'll have no `initialData`, and this
       * query will run on startup.
       */
      initialData: getLiveEventsCache(),
      initialDataUpdatedAt: () =>
        qc.getQueryState(liveEventsQueryKey)?.dataUpdatedAt,
      queryKey: liveEventsQueryKey,
      async queryFn() {
        console.debug(`live-events: fetching config`)
        return getLiveEvents()
      },
    },
    qc,
  )

  return (
    <Context.Provider value={data || {feeds: []}}>{children}</Context.Provider>
  )
}
