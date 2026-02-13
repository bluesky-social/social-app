import {createContext, useContext} from 'react'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {APP_CONFIG_URL} from '#/env'

const qc = new QueryClient()
const appConfigQueryKey = ['app-config']

/**
 * Matches the types defined in our `app-config` worker
 */
type AppConfigResponse = {
  liveNow: {
    allow: string[]
    exceptions: {
      did: string
      allow: string[]
    }[]
  }
}

export const DEFAULT_APP_CONFIG_RESPONSE: AppConfigResponse = {
  liveNow: {
    allow: [],
    exceptions: [],
  },
}

async function fetchAppConfig(): Promise<AppConfigResponse | null> {
  try {
    const res = await fetch(`${APP_CONFIG_URL}/config`)
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

const Context = createContext<AppConfigResponse>(DEFAULT_APP_CONFIG_RESPONSE)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {data} = useQuery(
    {
      staleTime: Infinity,
      gcTime: Infinity,
      queryKey: appConfigQueryKey,
      async queryFn() {
        return fetchAppConfig()
      },
    },
    qc,
  )
  return (
    <Context.Provider value={data ?? DEFAULT_APP_CONFIG_RESPONSE}>
      {children}
    </Context.Provider>
  )
}

export async function prefetchAppConfig() {
  const data = await fetchAppConfig()
  if (data) {
    qc.setQueryData(appConfigQueryKey, data)
  }
}

export function useAppConfig() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('useAppConfig must be used within a Provider')
  }
  return ctx
}
