import {memo} from 'react'
import {type Insets} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {type Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useBookmarkMutation} from '#/state/queries/bookmarks/useBookmarkMutation'
import {useRequireAuth} from '#/state/session'
import {useTheme} from '#/alf'
import {
  Bookmark_Filled_Corner0_Rounded as BookmarkFilled,
  Bookmark_Stroke2_Corner0_Rounded as Bookmark,
} from '#/components/icons/Bookmark'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

export const BookmarkButton = memo(function BookmarkButton({
  post,
  big,
  logContext,
  hitSlop,
}: {
  post: Shadow<app.bsky.feed.defs.PostView>
  big?: boolean
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  hitSlop?: Insets
}): React.ReactNode {
  const t = useTheme()
  const {t: l} = useLingui()
  const requireAuth = useRequireAuth()
  const {isBookmarked, toggleBookmark} = usePostBookmark({post, logContext})

  return (
    <PostControlButton
      testID="postBookmarkBtn"
      big={big}
      active={isBookmarked}
      activeColor={t.palette.primary_500}
      label={isBookmarked ? l`Remove from saved posts` : l`Add to saved posts`}
      onPress={() => requireAuth(toggleBookmark)}
      hitSlop={hitSlop}>
      <PostControlButtonIcon icon={isBookmarked ? BookmarkFilled : Bookmark} />
    </PostControlButton>
  )
})

/**
 * Saves a post to the viewer's saved posts, or removes it, with the bookmark
 * button's metrics and toasts. Removing offers an undo.
 */
export function usePostBookmark({
  post,
  logContext,
}: {
  post: Shadow<app.bsky.feed.defs.PostView>
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const {mutateAsync: bookmark} = useBookmarkMutation()
  const cleanError = useCleanError()
  const {feedDescriptor} = useFeedFeedbackContext()

  const isBookmarked = !!post.viewer?.bookmarked

  const undoLabel = l({
    message: `Undo`,
    context: `Button label to undo saving/removing a post from saved posts.`,
  })

  const save = async () => {
    try {
      await bookmark({
        action: 'create',
        post,
      })

      ax.metric('post:bookmark', {
        uri: post.uri,
        authorDid: post.author.did,
        logContext,
        feedDescriptor,
      })
      return true
    } catch (e: any) {
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
      return false
    }
  }

  const remove = async () => {
    try {
      await bookmark({
        action: 'delete',
        uri: post.uri,
      })

      ax.metric('post:unbookmark', {
        uri: post.uri,
        authorDid: post.author.did,
        logContext,
        feedDescriptor,
      })

      toast.show(
        <toast.Outer>
          <toast.Icon icon={TrashIcon} />
          <toast.Text>
            <Trans>Removed from saved posts</Trans>
          </toast.Text>
          <toast.Action label={undoLabel} onPress={() => save()}>
            {undoLabel}
          </toast.Action>
        </toast.Outer>,
      )
    } catch (e: any) {
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
    }
  }

  /**
   * Resolves with `'saved'` once a save succeeds, for callers that confirm it
   * themselves. Removing confirms with its own toast.
   */
  const toggleBookmark = async (): Promise<'saved' | undefined> => {
    if (isBookmarked) {
      await remove()
    } else if (await save()) {
      return 'saved'
    }
  }

  return {isBookmarked, toggleBookmark}
}
