import {useCallback} from 'react'
import {type ModerationDecision} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
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
  moderation,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  logContext: Metrics['profile:follow']['logContext'] &
    Metrics['profile:unfollow']['logContext']
  moderation: ModerationDecision
}) {
  const {_} = useLingui()
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
          Toast.show(_(msg`An issue occurred, please try again.`), {
            type: 'error',
          })
        }
      }
    })
  }, [_, queueFollow, requireAuth])

  const unfollow = useCallback(() => {
    requireAuth(async () => {
      try {
        await queueUnfollow()
        Toast.show(
          _(
            msg`No longer following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
              moderation.ui('displayName'),
            )}`,
          ),
          {type: 'default'},
        )
      } catch (e: any) {
        logger.error(`useFollowMethods: failed to unfollow`, {
          message: String(e),
        })
        if (e?.name !== 'AbortError') {
          Toast.show(_(msg`An issue occurred, please try again.`), {
            type: 'error',
          })
        }
      }
    })
  }, [
    _,
    moderation,
    profile.displayName,
    profile.handle,
    queueUnfollow,
    requireAuth,
  ])

  return {
    follow,
    unfollow,
  }
}
