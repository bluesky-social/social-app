import {useCallback} from 'react'
import {type AtIdentifierString} from '@atproto/syntax'
import {useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'

/**
 * Fetches a fresh verification state from the app view and updates our profile
 * cache. This state is computed using a variety of factors on the server, so
 * we need to get this data from the server.
 */
export function useUpdateProfileVerificationCache() {
  const qc = useQueryClient()
  const client = useAppviewClient()

  return useCallback(
    async ({profile}: {profile: bsky.profile.AnyProfileView}) => {
      try {
        const updated = await client.call(app.bsky.actor.getProfile, {
          actor: (profile.did ?? '') as AtIdentifierString,
        })
        updateProfileShadow(qc, profile.did, {
          verification: updated.verification,
        })
      } catch (e) {
        logger.error(`useUpdateProfileVerificationCache failed`, {
          safeMessage: e,
        })
      }
    },
    [client, qc],
  )
}
