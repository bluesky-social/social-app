import React, {memo} from 'react'
import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {IS_INTERNAL} from '#/lib/app-info'
import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import {CountWheel} from '#/lib/custom-animations/CountWheel'
import {AnimatedLikeIcon} from '#/lib/custom-animations/LikeIcon'
import {useHaptics} from '#/lib/haptics'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useGate} from '#/lib/statsig/statsig'
import {type Shadow} from '#/state/cache/types'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {
  usePostLikeMutationQueue,
  usePostRepostMutationQueue,
} from '#/state/queries/post'
import {useRequireAuth, useSession} from '#/state/session'
import {
  ProgressGuideAction,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import {formatCount} from '#/view/com/util/numeric/format'
import {Text} from '#/view/com/util/text/Text'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as Bubble} from '#/components/icons/Bubble'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'
import {PostMenuButton} from './PostMenu'
import {RepostButton} from './RepostButton'
import {ShareMenuButton} from './ShareMenu'

let PostControls = ({
  big,
  post,
  record,
  richText,
  feedContext,
  reqId,
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
  reqId?: string | undefined
  style?: StyleProp<ViewStyle>
  onPressReply: () => void
  onPostReply?: (postUri: string | undefined) => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void
}): React.ReactNode => {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {_, i18n} = useLingui()
  const {openComposer} = useOpenComposer()
  const {currentAccount} = useSession()
  const [queueLike, queueUnlike] = usePostLikeMutationQueue(post, logContext)
  const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
    post,
    logContext,
  )
  const requireAuth = useRequireAuth()
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

  const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] =
    React.useState(false)

  const onPressToggleLike = async () => {
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
          reqId,
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
  }

  const onRepost = async () => {
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
          reqId,
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
  }

  const onQuote = () => {
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
      reqId,
    })
    openComposer({
      quote: post,
      onPost: onPostReply,
    })
  }

  const onShare = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionShare',
      feedContext,
      reqId,
    })
  }

  return (
    <View style={[a.flex_row, a.justify_between, a.align_center, style]}>
      <View
        style={[
          big ? a.align_center : [a.flex_1, a.align_start, {marginLeft: -6}],
          replyDisabled ? {opacity: 0.5} : undefined,
        ]}>
        <PostControlButton
          testID="replyBtn"
          onPress={
            !replyDisabled ? () => requireAuth(() => onPressReply()) : undefined
          }
          label={_(
            msg`Reply (${plural(post.replyCount || 0, {
              one: '# reply',
              other: '# replies',
            })})`,
          )}
          big={big}>
          <PostControlButtonIcon icon={Bubble} />
          {typeof post.replyCount !== 'undefined' && post.replyCount > 0 && (
            <PostControlButtonText>
              {formatCount(i18n, post.replyCount)}
            </PostControlButtonText>
          )}
        </PostControlButton>
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
        <PostControlButton
          testID="likeBtn"
          big={big}
          onPress={() => requireAuth(() => onPressToggleLike())}
          label={
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
          }>
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
        </PostControlButton>
      </View>
      <View
        style={
          big ? a.align_center : [gtMobile ? a.mr_sm : a.mr_xs, a.align_start]
        }>
        <ShareMenuButton
          testID="postShareBtn"
          post={post}
          big={big}
          record={record}
          richText={richText}
          timestamp={post.indexedAt}
          threadgateRecord={threadgateRecord}
          onShare={onShare}
        />
      </View>
      <View style={big ? a.align_center : [a.flex_1, a.align_start]}>
        <PostMenuButton
          testID="postDropdownBtn"
          post={post}
          postFeedContext={feedContext}
          postReqId={reqId}
          big={big}
          record={record}
          richText={richText}
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
PostControls = memo(PostControls)
export {PostControls}
