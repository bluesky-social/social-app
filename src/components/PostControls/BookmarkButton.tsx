import {memo, useCallback} from 'react'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {type Shadow} from '#/state/cache/post-shadow'
import {useBookmarkMutation} from '#/state/queries/bookmarks/useBookmarkMutation'
import {useTheme} from '#/alf'
import {Bookmark, BookmarkFilled} from '#/components/icons/Bookmark'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

export const BookmarkButton = memo(function BookmarkButton({
  post,
  big,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  big?: boolean
}): React.ReactNode {
  const t = useTheme()
  const {_} = useLingui()
  const {mutateAsync: bookmark} = useBookmarkMutation()
  const cleanError = useCleanError()

  const {uri, cid, viewer} = post
  const isBookmarked = !!viewer?.bookmarked

  const onHandlePress = useCallback(async () => {
    try {
      if (isBookmarked) {
        await bookmark({
          action: 'delete',
          uri,
        })
        // TODO toast
      } else {
        await bookmark({
          action: 'create',
          uri,
          cid,
        })
        // TODO toast
      }
    } catch (e) {
      const {raw, clean} = cleanError(e)
      console.log(clean || raw || e)
      // TODO toast
    }
  }, [uri, cid, isBookmarked, bookmark, cleanError])

  return (
    <PostControlButton
      testID="postBookmarkBtn"
      big={big}
      label={
        isBookmarked
          ? _(msg`Remove this post from your bookmarks`)
          : _(msg`Save this post to your bookmarks`)
      }
      onPress={onHandlePress}>
      <PostControlButtonIcon
        fill={isBookmarked ? t.palette.primary_500 : undefined}
        icon={isBookmarked ? BookmarkFilled : Bookmark}
      />
    </PostControlButton>
  )
})
