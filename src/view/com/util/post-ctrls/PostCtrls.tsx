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
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {IS_INTERNAL} from '#/lib/app-info'
import {DISCOVER_DEBUG_DIDS, POST_CTRL_HITSLOP} from '#/lib/constants'
import {CountWheel} from '#/lib/custom-animations/CountWheel'
import {AnimatedLikeIcon} from '#/lib/custom-animations/LikeIcon'
import {useHaptics} from '#/lib/haptics'
import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {useGate} from '#/lib/statsig/statsig'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {type Shadow} from '#/state/cache/types'
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
  onPostReply,
  logContext,
  threadgateRecord,
  onShowLess,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  feedContext?: string | undefined
  style?: StyleProp<ViewStyle>
  onPressReply: () => void
  onPostReply?: (postUri: string | undefined) => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void
}): React.ReactNode => {
  const t = useTheme()
  const {_, i18n} = useLingui()
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
  const isDiscoverDebugUser =
    IS_INTERNAL ||
    DISCOVER_DEBUG_DIDS[currentAccount?.did || ''] ||
    gate('debug_show_feedcontext')
  const isBlocked = Boolean(
    post.author.viewer?.blocking ||
      post.author.viewer?.blockedBy ||
      post.author.viewer?.blockingByList,
  )
  const replyDisabled = post.viewer?.replyDisabled

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

  const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] =
    React.useState(false)

  const onPressToggleLike = React.useCallback(async () => {
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
      return
    }

    try {
      setHasLikeIconBeenToggled(true)
      if (!post.viewer?.like) {
        playHaptic('Light')
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
    _,
    playHaptic,
    post.uri,
    post.viewer?.like,
    queueLike,
    queueUnlike,
    sendInteraction,
    captureAction,
    feedContext,
    isBlocked,
  ])

  const onRepost = useCallback(async () => {
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
      return
    }

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
    _,
    post.uri,
    post.viewer?.repost,
    queueRepost,
    queueUnrepost,
    sendInteraction,
    feedContext,
    isBlocked,
  ])

  const onQuote = useCallback(() => {
    if (isBlocked) {
      Toast.show(
        _(msg`Cannot interact with a blocked user`),
        'exclamation-circle',
      )
      return
    }

    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionQuote',
      feedContext,
    })
    openComposer({
      quote: post,
      onPost: onPostReply,
    })
  }, [
    _,
    sendInteraction,
    post,
    feedContext,
    openComposer,
    onPostReply,
    isBlocked,
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
      a.justify_center,
      a.align_center,
      a.overflow_hidden,
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
          replyDisabled ? {opacity: 0.5} : undefined,
        ]}>
        <Pressable
          testID="replyBtn"
          style={btnStyle}
          onPress={() => {
            if (!replyDisabled) {
              playHaptic('Light')
              requireAuth(() => onPressReply())
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={_(
            msg`Reply (${plural(post.replyCount || 0, {
              one: '# reply',
              other: '# replies',
            })})`,
          )}
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
              {formatCount(i18n, post.replyCount)}
            </Text>
          ) : undefined}
        </Pressable>
      </View>
      <View style={big ? a.align_center : [a.flex_1, a.align_start]}>
        <RepostButton
          isReposted={!!post.viewer?.repost}
          repostCount={(post.repostCount ?? 0) + (post.quoteCount ?? 0)}
          onRepost={onRepost}
          onQuote={onQuote}
          big={big}
          embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
        />
      </View>
      <View style={big ? a.align_center : [a.flex_1, a.align_start]}>
        <Pressable
          testID="likeBtn"
          style={btnStyle}
          onPress={() => requireAuth(() => onPressToggleLike())}
          accessibilityRole="button"
          accessibilityLabel={
            post.viewer?.like
              ? _(
                  msg`Unlike (${plural(post.likeCount || 0, {
                    one: '# like',
                    other: '# likes',
                  })})`,
                )
              : _(
                  msg`Like (${plural(post.likeCount || 0, {
                    one: '# like',
                    other: '# likes',
                  })})`,
                )
          }
          accessibilityHint=""
          hitSlop={POST_CTRL_HITSLOP}>
          <AnimatedLikeIcon
            isLiked={Boolean(post.viewer?.like)}
            big={big}
            hasBeenToggled={hasLikeIconBeenToggled}
          />
          <CountWheel
            likeCount={post.likeCount ?? 0}
            big={big}
            isLiked={Boolean(post.viewer?.like)}
            hasBeenToggled={hasLikeIconBeenToggled}
          />
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
              accessibilityRole="button"
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
              msg`This post is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
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
          threadgateRecord={threadgateRecord}
          onShowLess={onShowLess}
        />
      </View>
      {isDiscoverDebugUser && feedContext && (
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
            Toast.show(_(msg`Copied to clipboard`), 'clipboard-check')
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
