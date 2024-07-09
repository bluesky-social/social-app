import React, {memo, useCallback} from 'react'
import {
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {useGate} from '#/lib/statsig/statsig'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {s} from '#/lib/styles'
import {Shadow} from '#/state/cache/types'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {
  usePostLikeMutationQueue,
  usePostRepostMutationQueue,
} from '#/state/queries/post'
import {useRequireAuth, useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {
  ProgressGuideAction,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ArrowOutOfBox} from '#/components/icons/ArrowOutOfBox'
import {Bubble_Stroke2_Corner2_Rounded as Bubble} from '#/components/icons/Bubble'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2'
import * as Prompt from '#/components/Prompt'
import {PostDropdownBtn} from '../forms/PostDropdownBtn'
import {formatCount} from '../numeric/format'
import {Text} from '../text/Text'
import * as Toast from '../Toast'
import {RepostButton} from './RepostButton'

let PostCtrls = ({
  big,
  post,
  record,
  richText,
  feedContext,
  style,
  onPressReply,
  logContext,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  feedContext?: string | undefined
  style?: StyleProp<ViewStyle>
  onPressReply: () => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {openComposer} = useComposerControls()
  const {currentAccount} = useSession()
  const [queueLike, queueUnlike] = usePostLikeMutationQueue(post, logContext)
  const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
    post,
    logContext,
  )
  const requireAuth = useRequireAuth()
  const loggedOutWarningPromptControl = useDialogControl()
  const {sendInteraction} = useFeedFeedbackContext()
  const {captureAction} = useProgressGuideControls()
  const playHaptic = useHaptics()
  const gate = useGate()

  const shouldShowLoggedOutWarning = React.useMemo(() => {
    return (
      post.author.did !== currentAccount?.did &&
      !!post.author.labels?.find(label => label.val === '!no-unauthenticated')
    )
  }, [currentAccount, post])

  const defaultCtrlColor = React.useMemo(
    () => ({
      color: t.palette.contrast_500,
    }),
    [t],
  ) as StyleProp<ViewStyle>

  const onPressToggleLike = React.useCallback(async () => {
    try {
      if (!post.viewer?.like) {
        playHaptic()
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionLike',
          feedContext,
        })
        captureAction(ProgressGuideAction.Like)
        await queueLike()
      } else {
        await queueUnlike()
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }, [
    playHaptic,
    post.uri,
    post.viewer?.like,
    queueLike,
    queueUnlike,
    sendInteraction,
    captureAction,
    feedContext,
  ])

  const onRepost = useCallback(async () => {
    try {
      if (!post.viewer?.repost) {
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionRepost',
          feedContext,
        })
        await queueRepost()
      } else {
        await queueUnrepost()
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }, [
    post.uri,
    post.viewer?.repost,
    queueRepost,
    queueUnrepost,
    sendInteraction,
    feedContext,
  ])

  const onQuote = useCallback(() => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionQuote',
      feedContext,
    })
    openComposer({
      quote: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        indexedAt: post.indexedAt,
      },
    })
  }, [
    openComposer,
    post.uri,
    post.cid,
    post.author,
    post.indexedAt,
    record.text,
    sendInteraction,
    feedContext,
  ])

  const onShare = useCallback(() => {
    const urip = new AtUri(post.uri)
    const href = makeProfileLink(post.author, 'post', urip.rkey)
    const url = toShareUrl(href)
    shareUrl(url)
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionShare',
      feedContext,
    })
  }, [post.uri, post.author, sendInteraction, feedContext])

  const btnStyle = React.useCallback(
    ({pressed, hovered}: PressableStateCallbackType) => [
      a.gap_xs,
      a.rounded_full,
      a.flex_row,
      a.align_center,
      a.justify_center,
      {padding: 5},
      (pressed || hovered) && t.atoms.bg_contrast_25,
    ],
    [t.atoms.bg_contrast_25],
  )

  return (
    <View style={[a.flex_row, a.justify_between, a.align_center, style]}>
      <View
        style={[
          big ? a.align_center : [a.flex_1, a.align_start, {marginLeft: -6}],
          post.viewer?.replyDisabled ? {opacity: 0.5} : undefined,
        ]}>
        <Pressable
          testID="replyBtn"
          style={btnStyle}
          onPress={() => {
            if (!post.viewer?.replyDisabled) {
              requireAuth(() => onPressReply())
            }
          }}
          accessibilityLabel={plural(post.replyCount || 0, {
            one: 'Reply (# reply)',
            other: 'Reply (# replies)',
          })}
          accessibilityHint=""
          hitSlop={POST_CTRL_HITSLOP}>
          <Bubble
            style={[defaultCtrlColor, {pointerEvents: 'none'}]}
            width={big ? 22 : 18}
          />
          {typeof post.replyCount !== 'undefined' && post.replyCount > 0 ? (
            <Text
              style={[
                defaultCtrlColor,
                big ? a.text_md : {fontSize: 15},
                a.user_select_none,
              ]}>
              {formatCount(post.replyCount)}
            </Text>
          ) : undefined}
        </Pressable>
      </View>
      <View style={big ? a.align_center : [a.flex_1, a.align_start]}>
        <RepostButton
          isReposted={!!post.viewer?.repost}
          repostCount={post.repostCount}
          onRepost={onRepost}
          onQuote={onQuote}
          big={big}
        />
      </View>
      <View style={big ? a.align_center : [a.flex_1, a.align_start]}>
        <Pressable
          testID="likeBtn"
          style={btnStyle}
          onPress={() => requireAuth(() => onPressToggleLike())}
          accessibilityLabel={
            post.viewer?.like
              ? plural(post.likeCount || 0, {
                  one: 'Unlike (# like)',
                  other: 'Unlike (# likes)',
                })
              : plural(post.likeCount || 0, {
                  one: 'Like (# like)',
                  other: 'Like (# likes)',
                })
          }
          accessibilityHint=""
          hitSlop={POST_CTRL_HITSLOP}>
          {post.viewer?.like ? (
            <HeartIconFilled style={s.likeColor} width={big ? 22 : 18} />
          ) : (
            <HeartIconOutline
              style={[defaultCtrlColor, {pointerEvents: 'none'}]}
              width={big ? 22 : 18}
            />
          )}
          {typeof post.likeCount !== 'undefined' && post.likeCount > 0 ? (
            <Text
              testID="likeCount"
              style={[
                [
                  big ? a.text_md : {fontSize: 15},
                  a.user_select_none,
                  post.viewer?.like
                    ? [a.font_bold, s.likeColor]
                    : defaultCtrlColor,
                ],
              ]}>
              {formatCount(post.likeCount)}
            </Text>
          ) : undefined}
        </Pressable>
      </View>
      {big && (
        <>
          <View style={a.align_center}>
            <Pressable
              testID="shareBtn"
              style={btnStyle}
              onPress={() => {
                if (shouldShowLoggedOutWarning) {
                  loggedOutWarningPromptControl.open()
                } else {
                  onShare()
                }
              }}
              accessibilityLabel={_(msg`Share`)}
              accessibilityHint=""
              hitSlop={POST_CTRL_HITSLOP}>
              <ArrowOutOfBox
                style={[defaultCtrlColor, {pointerEvents: 'none'}]}
                width={22}
              />
            </Pressable>
          </View>
          <Prompt.Basic
            control={loggedOutWarningPromptControl}
            title={_(msg`Note about sharing`)}
            description={_(
              msg`This post is only visible to logged-in users. It won't be visible to people who aren't logged in.`,
            )}
            onConfirm={onShare}
            confirmButtonCta={_(msg`Share anyway`)}
          />
        </>
      )}
      <View style={big ? a.align_center : [a.flex_1, a.align_start]}>
        <PostDropdownBtn
          testID="postDropdownBtn"
          post={post}
          postFeedContext={feedContext}
          record={record}
          richText={richText}
          style={{padding: 5}}
          hitSlop={POST_CTRL_HITSLOP}
          timestamp={post.indexedAt}
        />
      </View>
      {gate('debug_show_feedcontext') && feedContext && (
        <Pressable
          accessible={false}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
          onPress={e => {
            e.stopPropagation()
            Clipboard.setStringAsync(feedContext)
            Toast.show(_(msg`Copied to clipboard`))
          }}>
          <Text
            style={{
              color: t.palette.contrast_400,
              fontSize: 7,
            }}>
            {feedContext}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
PostCtrls = memo(PostCtrls)
export {PostCtrls}
