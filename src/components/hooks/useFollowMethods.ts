import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/types'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useRequireAuth} from '#/state/session'
import * as Toast from '#/components/Toast'
import {type Metrics} from '#/analytics/metrics'
import type * as bsky from '#/types/bsky'

export function useFollowMethods({
  profile,
  logContext,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  logContext: Metrics['profile:follow']['logContext'] &
    Metrics['profile:unfollow']['logContext']
}) {
  const {t: l} = useLingui()
  const requireAuth = useRequireAuth()
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )

  const follow = useCallback(() => {
    requireAuth(async () => {
      try {
        await queueFollow()
      } catch (e: any) {
        logger.error(`useFollowMethods: failed to follow`, {message: String(e)})
        if (e?.name !== 'AbortError') {
          Toast.show(l`An issue occurred, please try again.`, {
            type: 'error',
          })
        }
      }
    })
  }, [l, queueFollow, requireAuth])

  const unfollow = useCallback(() => {
    requireAuth(async () => {
      try {
        await queueUnfollow()
      } catch (e: any) {
        logger.error(`useFollowMethods: failed to unfollow`, {
          message: String(e),
        })
        if (e?.name !== 'AbortError') {
          Toast.show(l`An issue occurred, please try again.`, {
            type: 'error',
          })
        }
      }
    })
  }, [l, queueUnfollow, requireAuth])

  return {
    follow,
    unfollow,
  }
}
