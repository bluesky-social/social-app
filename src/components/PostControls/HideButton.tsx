import {memo} from 'react'
import {type Insets} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {type Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useHiddenPosts, useHiddenPostsApi} from '#/state/preferences'
import {useRequireAuth, useSession} from '#/state/session'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import * as Prompt from '#/components/Prompt'
import * as toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {PostControlButton, PostControlButtonIcon} from './PostControlButton'

export const HideButton = memo(function HideButton({
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
  const ax = useAnalytics()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const hiddenPosts = useHiddenPosts()
  const {hidePost} = useHiddenPostsApi()
  const cleanError = useCleanError()
  const requireAuth = useRequireAuth()
  const {feedDescriptor} = useFeedFeedbackContext()
  const hidePromptControl = Prompt.usePromptControl()

  const isAuthor = currentAccount?.did === post.author.did
  const isPostHidden = hiddenPosts?.includes(post.uri)

  const onConfirmHide = () => {
    try {
      hidePost({uri: post.uri})

      ax.metric('thread:click:hideReplyForMe', {
        uri: post.uri,
        authorDid: post.author.did,
        logContext,
        feedDescriptor,
      })

      toast.show(
        <toast.Outer>
          <toast.Icon icon={EyeSlash} />
          <toast.Text>{_(msg`Post hidden`)}</toast.Text>
        </toast.Outer>,
      )
    } catch (e: any) {
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
    }
  }

  const onToggleHide = () =>
    requireAuth(() => {
      hidePromptControl.open()
    })

  if (isAuthor || isPostHidden) {
    return null
  }

  return (
    <>
      <PostControlButton
        testID="postHideBtn"
        big={big}
        label={_(msg`Hide post`)}
        onPress={onToggleHide}
        hitSlop={hitSlop}>
        <PostControlButtonIcon icon={EyeSlash} />
      </PostControlButton>

      <Prompt.Basic
        control={hidePromptControl}
        title={_(msg`Hide this post?`)}
        description={_(
          msg`This post will be hidden from feeds and threads. This cannot be undone.`,
        )}
        onConfirm={onConfirmHide}
        confirmButtonCta={_(msg`Hide`)}
      />
    </>
  )
})
