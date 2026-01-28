import {useMemo} from 'react'
import {
  type $Typed,
  type AppBskyActorDefs,
  AppBskyEmbedExternal,
  AtUri,
} from '@atproto/api'
import {isAfter, parseISO} from 'date-fns'

import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {type LiveNowConfig, useLiveNowConfig} from '#/state/service-config'
import {useTickEveryMinute} from '#/state/shell'
import type * as bsky from '#/types/bsky'

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
