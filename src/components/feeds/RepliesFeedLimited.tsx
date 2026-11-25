import {useLingui} from '@lingui/react/macro'

import {EmptyState} from '#/view/com/util/EmptyState'
import {Message_Stroke1_Corner0_Rounded_Filled as MessageIcon} from '#/components/icons/Message'

export function RepliesFeedLimited({hasPosts = false}: {hasPosts?: boolean}) {
  const {t: l} = useLingui()

  return (
    <EmptyState
      testID="repliesPageFillLimit"
      icon={MessageIcon}
      message={
        hasPosts
          ? l({
              message:
                'No more posts or replies found in recent activity. Older posts are unavailable at this time.',
              comment:
                'Shown only in the rare case where we cannot fully populate the replies feed for a user. "Activity" means posts, replies, reposts, etc. This variant appears after some posts or replies have been shown.',
            })
          : l({
              message:
                'No posts or replies found in recent activity. Older posts are unavailable at this time.',
              comment:
                'Shown only in the rare case where we cannot fully populate the replies feed for a user. "Activity" means posts, replies, reposts, etc. This variant appears when no posts or replies could be shown.',
            })
      }
    />
  )
}
