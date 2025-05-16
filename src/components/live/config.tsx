import {createContext, useContext, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'

import {logger} from '#/logger'
import {STALE} from '#/state/queries'

// todo: replace with real type
type TEMP_LiveNowConfig = {
  dids: string[]
  domains: string[]
}

const RQKEY = ['unspecced-live-now-config']

function useLiveNowConfigQuery() {
  return useQuery({
    queryKey: RQKEY,
    queryFn: () => {
      // todo: replace with api call
      return {
        dids: ['did:plc:p2cp5gopk7mgjegy6wadk3ep'],
        domains: ['twitch.tv'],
      } satisfies TEMP_LiveNowConfig
    },
    staleTime: STALE.HOURS.ONE,
  })
}

const empty = {
  dids: [],
  domains: [],
} satisfies TEMP_LiveNowConfig

const LiveNowConfigContext = createContext<TEMP_LiveNowConfig | null>(null)

export function LiveNowConfigProvider({children}: {children: React.ReactNode}) {
  const {data, error} = useLiveNowConfigQuery()

  useEffect(() => {
    if (error) {
      logger.error('Failed to fetch live now config', {safeMessage: error})
    }
  }, [error])

  return (
    <LiveNowConfigContext.Provider value={data ?? empty}>
      {children}
    </LiveNowConfigContext.Provider>
  )
}

export function useLiveNowConfig() {
  const ctx = useContext(LiveNowConfigContext)
  if (!ctx) {
    throw new Error(
      'useLiveNowConfig must be used within a LiveNowConfigProvider',
    )
  }
  return ctx
}

export function useCanGoLive(did?: string) {
  const {dids} = useLiveNowConfig()
  return dids.includes(did ?? 'pwi')
}
