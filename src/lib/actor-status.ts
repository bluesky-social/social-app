import {useMemo} from 'react'
import {
  type $Typed,
  type AppBskyActorDefs,
  AppBskyEmbedExternal,
} from '@atproto/api'
import {isAfter, parseISO} from 'date-fns'

import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useAllowedLiveDomains} from '#/state/service-config'
import {useTickEveryMinute} from '#/state/shell'
import type * as bsky from '#/types/bsky'

export function useActorStatus(actor?: bsky.profile.AnyProfileView) {
  const shadowed = useMaybeProfileShadow(actor)
  const tick = useTickEveryMinute()
  const allowedDomains = useAllowedLiveDomains(shadowed?.did)

  return useMemo(() => {
    tick! // revalidate every minute

    if (
      shadowed &&
      'status' in shadowed &&
      shadowed.status &&
      validateStatus(shadowed.status, allowedDomains) &&
      isStatusStillActive(shadowed.status.expiresAt)
    ) {
      return {
        isActive: true,
        status: 'app.bsky.actor.status#live',
        embed: shadowed.status.embed as $Typed<AppBskyEmbedExternal.View>, // temp_isStatusValid asserts this
        expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
        record: shadowed.status.record,
      } satisfies AppBskyActorDefs.StatusView
    } else {
      return {
        status: '',
        isActive: false,
        record: {},
      } satisfies AppBskyActorDefs.StatusView
    }
  }, [shadowed, allowedDomains, tick])
}

export function isStatusStillActive(timeStr: string | undefined) {
  if (!timeStr) return false
  const now = new Date()
  const expiry = parseISO(timeStr)

  return isAfter(expiry, now)
}

export function validateStatus(
  status: AppBskyActorDefs.StatusView,
  allowedDomains: string[],
) {
  if (status.status !== 'app.bsky.actor.status#live') return false
  if (allowedDomains.length === 0) {
    return false
  }
  try {
    if (AppBskyEmbedExternal.isView(status.embed)) {
      const url = new URL(status.embed.external.uri)
      return allowedDomains.includes(url.hostname)
    } else {
      return false
    }
  } catch {
    return false
  }
}
