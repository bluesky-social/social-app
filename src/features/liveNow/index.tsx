import {useMemo} from 'react'
import {
  type $Typed,
  type AppBskyActorDefs,
  AppBskyEmbedExternal,
  AtUri,
} from '@atproto/api'
import {isAfter, parseISO} from 'date-fns'

import {useAppConfig} from '#/state/appConfig'
import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useSession} from '#/state/session'
import {useTickEveryMinute} from '#/state/shell'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export * from '#/features/liveNow/utils'

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

export function useActorStatus(actor?: bsky.profile.AnyProfileView) {
  const shadowed = useMaybeProfileShadow(actor)
  const tick = useTickEveryMinute()
  const config = useLiveNowConfig()

  return useMemo(() => {
    void tick // revalidate every minute

    if (shadowed && 'status' in shadowed && shadowed.status) {
      const isValid = isStatusValidForViewers(shadowed.status, config)
      const isDisabled = shadowed.status.isDisabled || false
      const isActive = isStatusStillActive(shadowed.status.expiresAt)
      if (isValid && !isDisabled && isActive) {
        return {
          uri: shadowed.status.uri,
          cid: shadowed.status.cid,
          isDisabled: false,
          isActive: true,
          status: 'app.bsky.actor.status#live',
          embed: shadowed.status.embed as $Typed<AppBskyEmbedExternal.View>, // temp_isStatusValid asserts this
          expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
          record: shadowed.status.record,
        } satisfies AppBskyActorDefs.StatusView
      }
      return {
        uri: shadowed.status.uri,
        cid: shadowed.status.cid,
        isDisabled,
        isActive: false,
        status: 'app.bsky.actor.status#live',
        embed: shadowed.status.embed as $Typed<AppBskyEmbedExternal.View>, // temp_isStatusValid asserts this
        expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
        record: shadowed.status.record,
      } satisfies AppBskyActorDefs.StatusView
    } else {
      return {
        status: '',
        isDisabled: false,
        isActive: false,
        record: {},
      } satisfies AppBskyActorDefs.StatusView
    }
  }, [shadowed, config, tick])
}

export function isStatusStillActive(timeStr: string | undefined) {
  if (!timeStr) return false
  const now = new Date()
  const expiry = parseISO(timeStr)

  return isAfter(expiry, now)
}

/**
 * Validates whether the live status is valid for display in the app. Does NOT
 * validate if the status is valid for the acting user e.g. as they go live.
 */
export function isStatusValidForViewers(
  status: AppBskyActorDefs.StatusView,
  config: LiveNowConfig,
) {
  if (status.status !== 'app.bsky.actor.status#live') return false
  if (!status.uri) return false // should not happen, just backwards compat
  try {
    const {host: liveDid} = new AtUri(status.uri)
    if (AppBskyEmbedExternal.isView(status.embed)) {
      const url = new URL(status.embed.external.uri)
      const exception = config.allowedHostsExceptionsByDid.get(liveDid)
      const isValidException = exception ? exception.has(url.hostname) : false
      const isValidForAnyone = config.defaultAllowedHosts.has(url.hostname)
      return isValidException || isValidForAnyone
    } else {
      return false
    }
  } catch {
    return false
  }
}
