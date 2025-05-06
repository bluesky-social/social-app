import {useMemo} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'

import {temp__canBeLive} from '#/components/live/temp'
import type * as bsky from '#/types/bsky'

export function useActorStatus(actor: bsky.profile.AnyProfileView) {
  return useMemo(() => {
    if (temp__canBeLive(actor) && 'status' in actor && actor.status) {
      return actor.status
    } else {
      return {
        status: 'app.bsky.actor.status#live',
        isActive: false,
        record: {},
      } satisfies AppBskyActorDefs.StatusView
    }
  }, [actor])
}
