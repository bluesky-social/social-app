import {createContext, useContext} from 'react'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {IS_DEV, LIVE_EVENTS_URL} from '#/env'
import {type LiveEventsWorkerResponse} from '#/features/liveEvents/types'

const qc = new QueryClient()
const liveEventsQueryKey = ['live-events']

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

const Context = createContext<LiveEventsWorkerResponse>({
  feeds: [],
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {data} = useQuery(
    {
      staleTime: IS_DEV ? 5e3 : 1000 * 60,
      queryKey: liveEventsQueryKey,
      async queryFn() {
        return fetchLiveEvents()
      },
    },
    qc,
  )

  return (
    <Context.Provider value={data || {feeds: []}}>{children}</Context.Provider>
  )
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
