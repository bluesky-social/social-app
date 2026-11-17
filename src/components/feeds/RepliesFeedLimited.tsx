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
          ? l`No more posts or replies found in recent activity. Older posts are unavailable at this time.`
          : l`No posts or replies found in recent activity. Older posts are unavailable at this time.`
      }
    />
  )
}
