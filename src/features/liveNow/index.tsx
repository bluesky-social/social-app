import {useMemo} from 'react'

import {useAppConfig} from '#/state/appConfig'
import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'

export const DEFAULT_ALLOWED_DOMAINS = [
  'twitch.tv',
  'stream.place',
  'bluecast.app',

  // TODO remove need for subdomains
  'www.twitch.tv',
  'www.bluecast.app',
]

export type LiveNowConfig = {
  canGoLive: boolean
  currentAccountAllowedHosts: Set<string>
  defaultAllowedHosts: Set<string>
  allowedHostsExceptionsByDid: Map<string, Set<string>>
}

export function useLiveNowConfig(): LiveNowConfig {
  const ax = useAnalytics()
  const {liveNow} = useAppConfig()
  const {currentAccount} = useSession()

  return useMemo(() => {
    const disabled = ax.features.enabled(ax.features.LiveNowBetaDisable)

    if (!currentAccount?.did || disabled) {
      return {
        canGoLive: false,
        currentAccountAllowedHosts: new Set(),
        defaultAllowedHosts: new Set(),
        allowedHostsExceptionsByDid: new Map(),
      }
    }

    const defaultAllowedHosts = new Set(
      DEFAULT_ALLOWED_DOMAINS.concat(liveNow.allow),
    )
    const allowedHostsExceptionsByDid = new Map<string, Set<string>>()
    for (const ex of liveNow.exceptions) {
      allowedHostsExceptionsByDid.set(
        ex.did,
        new Set(DEFAULT_ALLOWED_DOMAINS.concat(ex.allow)),
      )
    }

    return {
      canGoLive: true,
      currentAccountAllowedHosts:
        allowedHostsExceptionsByDid.get(currentAccount.did) ??
        defaultAllowedHosts,
      defaultAllowedHosts,
      allowedHostsExceptionsByDid,
    }
  }, [ax, liveNow, currentAccount])
}
