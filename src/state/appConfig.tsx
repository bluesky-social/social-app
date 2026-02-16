import {createContext, useContext} from 'react'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {networkRetry} from '#/lib/async/retry'
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

let fetchAppConfigPromise: Promise<AppConfigResponse>

async function fetchAppConfig(): Promise<AppConfigResponse | null> {
  try {
    if (!fetchAppConfigPromise) {
      fetchAppConfigPromise = networkRetry(
        3,
        async () => {
          const r = await fetch(`${APP_CONFIG_URL}/config`)
          if (!r.ok) throw new Error(await r.text())
          const data = await r.json()
          return data
        },
        1e3,
      )
    }
    return await fetchAppConfigPromise
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
