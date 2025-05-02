import {useMemo} from 'react'

import {temp__canBeLive} from '#/components/live/temp'
import type * as bsky from '#/types/bsky'

export function useActorStatus(actor: bsky.profile.AnyProfileView) {
  return useMemo(() => ({live: temp__canBeLive(actor)}), [actor])
}
