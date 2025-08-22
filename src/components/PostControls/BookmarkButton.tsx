import {memo} from 'react'
import {type AppBskyFeedDefs, type AppBskyFeedPost} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {type Shadow} from '#/state/cache/post-shadow'
import {Bookmark} from '#/components/icons/Bookmark'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

export const BookmarkButton = memo(function BookmarkButton({
  big,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  big?: boolean
  record: AppBskyFeedPost.Record
}): React.ReactNode {
  const {_} = useLingui()

  return (
    <PostControlButton
      testID="postBookmarkBtn"
      big={big}
      label={_(msg`Bookmark this post`)}>
      <PostControlButtonIcon icon={Bookmark} />
    </PostControlButton>
  )
})
