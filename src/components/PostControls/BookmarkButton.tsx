import {memo} from 'react'
import {type Insets} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/post-shadow'
import {useBookmarkMutation} from '#/state/queries/bookmarks/useBookmarkMutation'
import {useTheme} from '#/alf'
import {Bookmark, BookmarkFilled} from '#/components/icons/Bookmark'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as toast from '#/components/Toast'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

export const BookmarkButton = memo(function BookmarkButton({
  post,
  big,
  logContext,
  hitSlop,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  big?: boolean
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  hitSlop?: Insets
}): React.ReactNode {
  const t = useTheme()
  const {_} = useLingui()
  const {mutateAsync: bookmark} = useBookmarkMutation()
  const cleanError = useCleanError()

  const {viewer} = post
  const isBookmarked = !!viewer?.bookmarked

  const undoLabel = _(
    msg({
      message: `Undo`,
      context: `Button label to undo saving/removing a post from saved posts.`,
    }),
  )

  const save = async ({disableUndo}: {disableUndo?: boolean} = {}) => {
    try {
      await bookmark({
        action: 'create',
        post,
      })

      logger.metric('post:bookmark', {logContext})

      toast.show(
        <toast.Outer>
          <toast.Icon />
          <toast.Text>
            <Trans>Post saved</Trans>
          </toast.Text>
          {!disableUndo && (
            <toast.Action
              label={undoLabel}
              onPress={() => remove({disableUndo: true})}>
              {undoLabel}
            </toast.Action>
          )}
        </toast.Outer>,
        {
          type: 'success',
        },
      )
    } catch (e: any) {
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
    }
  }

  const remove = async ({disableUndo}: {disableUndo?: boolean} = {}) => {
    try {
      await bookmark({
        action: 'delete',
        uri: post.uri,
      })

      logger.metric('post:unbookmark', {logContext})

      toast.show(
        <toast.Outer>
          <toast.Icon icon={TrashIcon} />
          <toast.Text>
            <Trans>Removed from saved posts</Trans>
          </toast.Text>
          {!disableUndo && (
            <toast.Action
              label={undoLabel}
              onPress={() => save({disableUndo: true})}>
              {undoLabel}
            </toast.Action>
          )}
        </toast.Outer>,
      )
    } catch (e: any) {
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
    }
  }

  const onHandlePress = async () => {
    if (isBookmarked) {
      await remove()
    } else {
      await save()
    }
  }

  return (
    <PostControlButton
      testID="postBookmarkBtn"
      big={big}
      label={
        isBookmarked
          ? _(msg`Remove from saved posts`)
          : _(msg`Add to saved posts`)
      }
      onPress={onHandlePress}
      hitSlop={hitSlop}>
      <PostControlButtonIcon
        fill={isBookmarked ? t.palette.primary_500 : undefined}
        icon={isBookmarked ? BookmarkFilled : Bookmark}
      />
    </PostControlButton>
  )
})
