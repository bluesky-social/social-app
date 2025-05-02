import {useMemo} from 'react'

import type * as bsky from '#/types/bsky'

export function useActorStatus(actor: bsky.profile.AnyProfileView) {
  return useMemo(() => ({live: actor.handle === 'hailey.at'}), [actor])
}
