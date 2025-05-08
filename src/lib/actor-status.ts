import {useMemo} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {isAfter, parseISO} from 'date-fns'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useTickEveryMinute} from '#/state/shell'
import {temp__canBeLive, temp__isStatusValid} from '#/components/live/temp'
import type * as bsky from '#/types/bsky'

export function useActorStatus(actor: bsky.profile.AnyProfileView) {
  const shadowed = useProfileShadow(actor)
  const tick = useTickEveryMinute()
  return useMemo(() => {
    tick! // revalidate every minute

    if (
      temp__canBeLive(shadowed) &&
      'status' in shadowed &&
      shadowed.status &&
      temp__isStatusValid(shadowed.status) &&
      isStatusStillActive(shadowed.status.expiresAt)
    ) {
      return shadowed.status
    } else {
      return {
        status: '',
        isActive: false,
        record: {},
      } satisfies AppBskyActorDefs.StatusView
    }
  }, [shadowed, tick])
}

function isStatusStillActive(timeStr: string | undefined) {
  if (!timeStr) return false
  const now = new Date()
  const expiry = parseISO(timeStr)

  return isAfter(expiry, now)
}
