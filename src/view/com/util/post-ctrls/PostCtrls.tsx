import React, {memo, useCallback} from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import {Text} from '../text/Text'
import {PostDropdownBtn} from '../forms/PostDropdownBtn'
import {HeartIcon, HeartIconSolid, CommentBottomArrow} from 'lib/icons'
import {s, colors} from 'lib/styles'
import {pluralize} from 'lib/strings/helpers'
import {useTheme} from 'lib/ThemeContext'
import {RepostButton} from './RepostButton'
import {Haptics} from 'lib/haptics'
import {HITSLOP_10, HITSLOP_20} from 'lib/constants'
import {useModalControls} from '#/state/modals'
import {
  usePostLikeMutation,
  usePostUnlikeMutation,
  usePostRepostMutation,
  usePostUnrepostMutation,
} from '#/state/queries/post'
import {useComposerControls} from '#/state/shell/composer'
import {Shadow} from '#/state/cache/types'
import {useRequireAuth} from '#/state/session'

let PostCtrls = ({
  big,
  post,
  record,
  style,
  onPressReply,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  style?: StyleProp<ViewStyle>
  onPressReply: () => void
}): React.ReactNode => {
  const theme = useTheme()
  const {openComposer} = useComposerControls()
  const {closeModal} = useModalControls()
  const postLikeMutation = usePostLikeMutation()
  const postUnlikeMutation = usePostUnlikeMutation()
  const postRepostMutation = usePostRepostMutation()
  const postUnrepostMutation = usePostUnrepostMutation()
  const requireAuth = useRequireAuth()

  const defaultCtrlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  ) as StyleProp<ViewStyle>

  const onPressToggleLike = React.useCallback(async () => {
    if (!post.viewer?.like) {
      Haptics.default()
      postLikeMutation.mutate({
        uri: post.uri,
        cid: post.cid,
        likeCount: post.likeCount || 0,
      })
    } else {
      postUnlikeMutation.mutate({
        postUri: post.uri,
        likeUri: post.viewer.like,
        likeCount: post.likeCount || 0,
      })
    }
  }, [
    post.viewer?.like,
    post.uri,
    post.cid,
    post.likeCount,
    postLikeMutation,
    postUnlikeMutation,
  ])

  const onRepost = useCallback(() => {
    closeModal()
    if (!post.viewer?.repost) {
      Haptics.default()
      postRepostMutation.mutate({
        uri: post.uri,
        cid: post.cid,
        repostCount: post.repostCount || 0,
      })
    } else {
      postUnrepostMutation.mutate({
        postUri: post.uri,
        repostUri: post.viewer.repost,
        repostCount: post.repostCount || 0,
      })
    }
  }, [
    post.uri,
    post.cid,
    post.viewer?.repost,
    post.repostCount,
    closeModal,
    postRepostMutation,
    postUnrepostMutation,
  ])

  const onQuote = useCallback(() => {
    closeModal()
    openComposer({
      quote: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        indexedAt: post.indexedAt,
      },
    })
    Haptics.default()
  }, [
    post.uri,
    post.cid,
    post.author,
    post.indexedAt,
    record.text,
    openComposer,
    closeModal,
  ])

  return (
    <View style={[styles.ctrls, style]}>
      <TouchableOpacity
        testID="replyBtn"
        style={[
          styles.ctrl,
          !big && styles.ctrlPad,
          {paddingLeft: 0},
          post.viewer?.replyDisabled ? {opacity: 0.5} : undefined,
        ]}
        onPress={() => {
          if (!post.viewer?.replyDisabled) {
            requireAuth(() => onPressReply())
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Reply (${post.replyCount} ${
          post.replyCount === 1 ? 'reply' : 'replies'
        })`}
        accessibilityHint=""
        hitSlop={big ? HITSLOP_20 : HITSLOP_10}>
        <CommentBottomArrow
          style={[defaultCtrlColor, big ? s.mt2 : styles.mt1]}
          strokeWidth={3}
          size={big ? 20 : 15}
        />
        {typeof post.replyCount !== 'undefined' ? (
          <Text style={[defaultCtrlColor, s.ml5, s.f15]}>
            {post.replyCount}
          </Text>
        ) : undefined}
      </TouchableOpacity>
      <RepostButton
        big={big}
        isReposted={!!post.viewer?.repost}
        repostCount={post.repostCount}
        onRepost={onRepost}
        onQuote={onQuote}
      />
      <TouchableOpacity
        testID="likeBtn"
        style={[styles.ctrl, !big && styles.ctrlPad]}
        onPress={() => {
          requireAuth(() => onPressToggleLike())
        }}
        accessibilityRole="button"
        accessibilityLabel={`${post.viewer?.like ? 'Unlike' : 'Like'} (${
          post.likeCount
        } ${pluralize(post.likeCount || 0, 'like')})`}
        accessibilityHint=""
        hitSlop={big ? HITSLOP_20 : HITSLOP_10}>
        {post.viewer?.like ? (
          <HeartIconSolid style={styles.ctrlIconLiked} size={big ? 22 : 16} />
        ) : (
          <HeartIcon
            style={[defaultCtrlColor, big ? styles.mt1 : undefined]}
            strokeWidth={3}
            size={big ? 20 : 16}
          />
        )}
        {typeof post.likeCount !== 'undefined' ? (
          <Text
            testID="likeCount"
            style={
              post.viewer?.like
                ? [s.bold, s.red3, s.f15, s.ml5]
                : [defaultCtrlColor, s.f15, s.ml5]
            }>
            {post.likeCount}
          </Text>
        ) : undefined}
      </TouchableOpacity>
      {big ? undefined : (
        <PostDropdownBtn
          testID="postDropdownBtn"
          postAuthor={post.author}
          postCid={post.cid}
          postUri={post.uri}
          record={record}
          style={styles.ctrlPad}
        />
      )}
      {/* used for adding pad to the right side */}
      <View />
    </View>
  )
}
PostCtrls = memo(PostCtrls)
export {PostCtrls}

const styles = StyleSheet.create({
  ctrls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ctrl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctrlPad: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 5,
    paddingRight: 5,
  },
  ctrlIconLiked: {
    color: colors.like,
  },
  mt1: {
    marginTop: 1,
  },
})
