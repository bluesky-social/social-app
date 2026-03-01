import React from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/types'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useRequireAuth} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
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
  const {_} = useLingui()
  const requireAuth = useRequireAuth()
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )

  const follow = React.useCallback(() => {
    requireAuth(async () => {
      try {
        await queueFollow()
      } catch (e: any) {
        logger.error(`useFollowMethods: failed to follow`, {message: String(e)})
        if (e?.name !== 'AbortError') {
          Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
        }
      }
    })
  }, [_, queueFollow, requireAuth])

  const unfollow = React.useCallback(() => {
    requireAuth(async () => {
      try {
        await queueUnfollow()
      } catch (e: any) {
        logger.error(`useFollowMethods: failed to unfollow`, {
          message: String(e),
        })
        if (e?.name !== 'AbortError') {
          Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
        }
      }
    })
  }, [_, queueUnfollow, requireAuth])

  return {
    follow,
    unfollow,
  }
}
