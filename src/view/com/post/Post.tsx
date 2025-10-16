import {useCallback, useMemo, useState} from 'react'
import {type StyleProp, StyleSheet, View, type ViewStyle} from 'react-native'
import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  moderatePost,
  type ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {useQueryClient} from '@tanstack/react-query'

import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {countLines} from '#/lib/strings/helpers'
import {colors} from '#/lib/styles'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {Link} from '#/view/com/util/Link'
import {PostMeta} from '#/view/com/util/PostMeta'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {PostRepliedTo} from '#/components/Post/PostRepliedTo'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls} from '#/components/PostControls'
import {RichText} from '#/components/RichText'
import {SubtleHover} from '#/components/SubtleHover'
import * as bsky from '#/types/bsky'

export function Post({
  post,
  showReplyLine,
  hideTopBorder,
  style,
  onBeforePress,
}: {
  post: AppBskyFeedDefs.PostView
  showReplyLine?: boolean
  hideTopBorder?: boolean
  style?: StyleProp<ViewStyle>
  onBeforePress?: () => void
}) {
  const moderationOpts = useModerationOpts()
  const record = useMemo<AppBskyFeedPost.Record | undefined>(
    () =>
      bsky.validate(post.record, AppBskyFeedPost.validateRecord)
        ? post.record
        : undefined,
    [post],
  )
  const postShadowed = usePostShadow(post)
  const richText = useMemo(
    () =>
      record
        ? new RichTextAPI({
            text: record.text,
            facets: record.facets,
          })
        : undefined,
    [record],
  )
  const moderation = useMemo(
    () => (moderationOpts ? moderatePost(post, moderationOpts) : undefined),
    [moderationOpts, post],
  )
  if (postShadowed === POST_TOMBSTONE) {
    return null
  }
  if (record && richText && moderation) {
    return (
      <PostInner
        post={postShadowed}
        record={record}
        richText={richText}
        moderation={moderation}
        showReplyLine={showReplyLine}
        hideTopBorder={hideTopBorder}
        style={style}
        onBeforePress={onBeforePress}
      />
    )
  }
  return null
}

function PostInner({
  post,
  record,
  richText,
  moderation,
  showReplyLine,
  hideTopBorder,
  style,
  onBeforePress: outerOnBeforePress,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  moderation: ModerationDecision
  showReplyLine?: boolean
  hideTopBorder?: boolean
  style?: StyleProp<ViewStyle>
  onBeforePress?: () => void
}) {
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const {openComposer} = useOpenComposer()
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const itemUrip = new AtUri(post.uri)
  const itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey)
  let replyAuthorDid = ''
  if (record.reply) {
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    replyAuthorDid = urip.hostname
  }

  const onPressReply = useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
        langs: record.langs,
      },
    })
  }, [openComposer, post, record, moderation])

  const onPressShowMore = useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  const onBeforePress = useCallback(() => {
    unstableCacheProfileView(queryClient, post.author)
    outerOnBeforePress?.()
  }, [queryClient, post.author, outerOnBeforePress])

  const [hover, setHover] = useState(false)
  return (
    <Link
      href={itemHref}
      style={[
        styles.outer,
        pal.border,
        !hideTopBorder && {borderTopWidth: StyleSheet.hairlineWidth},
        style,
      ]}
      onBeforePress={onBeforePress}
      onPointerEnter={() => {
        setHover(true)
      }}
      onPointerLeave={() => {
        setHover(false)
      }}>
      <SubtleHover hover={hover} />
      {showReplyLine && <View style={styles.replyLine} />}
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <PreviewableUserAvatar
            size={42}
            profile={post.author}
            moderation={moderation.ui('avatar')}
            type={post.author.associated?.labeler ? 'labeler' : 'user'}
          />
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            author={post.author}
            moderation={moderation}
            timestamp={post.indexedAt}
            postHref={itemHref}
          />
          {replyAuthorDid !== '' && (
            <PostRepliedTo parentAuthor={replyAuthorDid} />
          )}
          <LabelsOnMyPost post={post} />
          <ContentHider
            modui={moderation.ui('contentView')}
            style={styles.contentHider}
            childContainerStyle={styles.contentHiderChild}>
            <PostAlerts
              modui={moderation.ui('contentView')}
              style={[a.pb_xs]}
            />
            {richText.text ? (
              <View>
                <RichText
                  enableTags
                  testID="postText"
                  value={richText}
                  numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                  style={[a.flex_1, a.text_md]}
                  authorHandle={post.author.handle}
                  shouldProxyLinks={true}
                />
                {limitLines && (
                  <ShowMoreTextButton
                    style={[a.text_md]}
                    onPress={onPressShowMore}
                  />
                )}
              </View>
            ) : undefined}
            {post.embed ? (
              <Embed
                embed={post.embed}
                moderation={moderation}
                viewContext={PostEmbedViewContext.Feed}
              />
            ) : null}
          </ContentHider>
          <PostControls
            post={post}
            record={record}
            richText={richText}
            onPressReply={onPressReply}
            logContext="Post"
          />
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    paddingTop: 10,
    paddingRight: 15,
    paddingBottom: 5,
    paddingLeft: 10,
    // @ts-ignore web only -prf
    cursor: 'pointer',
  },
  layout: {
    flexDirection: 'row',
    gap: 10,
  },
  layoutAvi: {
    paddingLeft: 8,
  },
  layoutContent: {
    flex: 1,
  },
  alert: {
    marginBottom: 6,
  },
  replyLine: {
    position: 'absolute',
    left: 36,
    top: 70,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  contentHider: {
    marginBottom: 2,
  },
  contentHiderChild: {
    marginTop: 6,
  },
})
