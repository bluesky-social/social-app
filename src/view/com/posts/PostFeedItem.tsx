import {memo, useCallback, useMemo, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  type AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  AtUri,
  type ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useActorStatus} from '#/lib/actor-status'
import {type ReasonFeedSource} from '#/lib/api/feed/types'
import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {countLines} from '#/lib/strings/helpers'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {
  buildPostSourceKey,
  setUnstablePostSource,
} from '#/state/unstable-post-source'
import {Link} from '#/view/com/util/Link'
import {PostMeta} from '#/view/com/util/PostMeta'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {type AppModerationCause} from '#/components/Pills'
import {Embed} from '#/components/Post/Embed'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {PostRepliedTo} from '#/components/Post/PostRepliedTo'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls} from '#/components/PostControls'
import {DiscoverDebug} from '#/components/PostControls/DiscoverDebug'
import {RichText} from '#/components/RichText'
import {SubtleHover} from '#/components/SubtleHover'
import * as bsky from '#/types/bsky'
import {PostFeedReason} from './PostFeedReason'

interface FeedItemProps {
  record: AppBskyFeedPost.Record
  reason:
    | AppBskyFeedDefs.ReasonRepost
    | AppBskyFeedDefs.ReasonPin
    | ReasonFeedSource
    | {[k: string]: unknown; $type: string}
    | undefined
  moderation: ModerationDecision
  parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
  showReplyTo: boolean
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
  feedContext: string | undefined
  reqId: string | undefined
  hideTopBorder?: boolean
  isParentBlocked?: boolean
  isParentNotFound?: boolean
}

export function PostFeedItem({
  post,
  record,
  reason,
  feedContext,
  reqId,
  moderation,
  parentAuthor,
  showReplyTo,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
  hideTopBorder,
  isParentBlocked,
  isParentNotFound,
  rootPost,
  onShowLess,
}: FeedItemProps & {
  post: AppBskyFeedDefs.PostView
  rootPost: AppBskyFeedDefs.PostView
  onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void
}): React.ReactNode {
  const postShadowed = usePostShadow(post)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )
  if (postShadowed === POST_TOMBSTONE) {
    return null
  }
  if (richText && moderation) {
    return (
      <FeedItemInner
        // Safeguard from clobbering per-post state below:
        key={postShadowed.uri}
        post={postShadowed}
        record={record}
        reason={reason}
        feedContext={feedContext}
        reqId={reqId}
        richText={richText}
        parentAuthor={parentAuthor}
        showReplyTo={showReplyTo}
        moderation={moderation}
        isThreadChild={isThreadChild}
        isThreadLastChild={isThreadLastChild}
        isThreadParent={isThreadParent}
        hideTopBorder={hideTopBorder}
        isParentBlocked={isParentBlocked}
        isParentNotFound={isParentNotFound}
        rootPost={rootPost}
        onShowLess={onShowLess}
      />
    )
  }
  return null
}

let FeedItemInner = ({
  post,
  record,
  reason,
  feedContext,
  reqId,
  richText,
  moderation,
  parentAuthor,
  showReplyTo,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
  hideTopBorder,
  isParentBlocked,
  isParentNotFound,
  rootPost,
  onShowLess,
}: FeedItemProps & {
  richText: RichTextAPI
  post: Shadow<AppBskyFeedDefs.PostView>
  rootPost: AppBskyFeedDefs.PostView
  onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void
}): React.ReactNode => {
  const queryClient = useQueryClient()
  const {openComposer} = useOpenComposer()
  const navigation = useNavigation<NavigationProp>()
  const pal = usePalette('default')
  const gate = useGate()

  const [hover, setHover] = useState(false)

  const [href, rkey] = useMemo(() => {
    const urip = new AtUri(post.uri)
    return [makeProfileLink(post.author, 'post', urip.rkey), urip.rkey]
  }, [post.uri, post.author])
  const {sendInteraction, feedSourceInfo} = useFeedFeedbackContext()

  const onPressReply = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionReply',
      feedContext,
      reqId,
    })
    if (gate('feed_reply_button_open_thread')) {
      navigation.navigate('PostThread', {
        name: post.author.did,
        rkey,
      })
    } else {
      openComposer({
        replyTo: {
          uri: post.uri,
          cid: post.cid,
          text: record.text || '',
          author: post.author,
          embed: post.embed,
          moderation,
          langs: record.langs,
        },
      })
    }
  }

  const onOpenAuthor = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughAuthor',
      feedContext,
      reqId,
    })
  }

  const onOpenReposter = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughReposter',
      feedContext,
      reqId,
    })
  }

  const onOpenEmbed = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughEmbed',
      feedContext,
      reqId,
    })
  }

  const onBeforePress = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughItem',
      feedContext,
      reqId,
    })
    unstableCacheProfileView(queryClient, post.author)
    setUnstablePostSource(buildPostSourceKey(post.uri, post.author.handle), {
      feedSourceInfo,
      post: {
        post,
        reason: AppBskyFeedDefs.isReasonRepost(reason) ? reason : undefined,
        feedContext,
        reqId,
      },
    })
  }

  const outerStyles = [
    styles.outer,
    {
      borderColor: pal.colors.border,
      paddingBottom:
        isThreadLastChild || (!isThreadChild && !isThreadParent)
          ? 8
          : undefined,
      borderTopWidth:
        hideTopBorder || isThreadChild ? 0 : StyleSheet.hairlineWidth,
    },
  ]

  /**
   * If `post[0]` in this slice is the actual root post (not an orphan thread),
   * then we may have a threadgate record to reference
   */
  const threadgateRecord = bsky.dangerousIsType<AppBskyFeedThreadgate.Record>(
    rootPost.threadgate?.record,
    AppBskyFeedThreadgate.isRecord,
  )
    ? rootPost.threadgate.record
    : undefined

  const {isActive: live} = useActorStatus(post.author)

  const viaRepost = useMemo(() => {
    if (AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid) {
      return {
        uri: reason.uri,
        cid: reason.cid,
      }
    }
  }, [reason])

  return (
    <Link
      testID={`feedItem-by-${post.author.handle}`}
      style={outerStyles}
      href={href}
      noFeedback
      accessible={false}
      onBeforePress={onBeforePress}
      dataSet={{feedContext}}
      onPointerEnter={() => {
        setHover(true)
      }}
      onPointerLeave={() => {
        setHover(false)
      }}>
      <SubtleHover hover={hover} />
      <View style={{flexDirection: 'row', gap: 10, paddingLeft: 8}}>
        <View style={{width: 42}}>
          {isThreadChild && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginBottom: 4,
                },
              ]}
            />
          )}
        </View>

        <View style={[a.pt_sm, a.flex_shrink]}>
          {reason && (
            <PostFeedReason
              reason={reason}
              moderation={moderation}
              onOpenReposter={onOpenReposter}
            />
          )}
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <PreviewableUserAvatar
            size={42}
            profile={post.author}
            moderation={moderation.ui('avatar')}
            type={post.author.associated?.labeler ? 'labeler' : 'user'}
            onBeforePress={onOpenAuthor}
            live={live}
          />
          {isThreadParent && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginTop: live ? 8 : 4,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            author={post.author}
            moderation={moderation}
            timestamp={post.indexedAt}
            postHref={href}
            onOpenAuthor={onOpenAuthor}
          />
          {showReplyTo &&
            (parentAuthor || isParentBlocked || isParentNotFound) && (
              <PostRepliedTo
                parentAuthor={parentAuthor}
                isParentBlocked={isParentBlocked}
                isParentNotFound={isParentNotFound}
              />
            )}
          <LabelsOnMyPost post={post} />
          <PostContent
            moderation={moderation}
            richText={richText}
            postEmbed={post.embed}
            postAuthor={post.author}
            onOpenEmbed={onOpenEmbed}
            post={post}
            threadgateRecord={threadgateRecord}
          />
          <PostControls
            post={post}
            record={record}
            richText={richText}
            onPressReply={onPressReply}
            logContext="FeedItem"
            feedContext={feedContext}
            reqId={reqId}
            threadgateRecord={threadgateRecord}
            onShowLess={onShowLess}
            viaRepost={viaRepost}
          />
        </View>

        <DiscoverDebug feedContext={feedContext} />
      </View>
    </Link>
  )
}
FeedItemInner = memo(FeedItemInner)

let PostContent = ({
  post,
  moderation,
  richText,
  postEmbed,
  postAuthor,
  onOpenEmbed,
  threadgateRecord,
}: {
  moderation: ModerationDecision
  richText: RichTextAPI
  postEmbed: AppBskyFeedDefs.PostView['embed']
  postAuthor: AppBskyFeedDefs.PostView['author']
  onOpenEmbed: () => void
  post: AppBskyFeedDefs.PostView
  threadgateRecord?: AppBskyFeedThreadgate.Record
}): React.ReactNode => {
  const {currentAccount} = useSession()
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText.text) >= MAX_POST_LINES,
  )
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
    const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri)
    const rootPostUri = bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    )
      ? post.record?.reply?.root?.uri || post.uri
      : undefined
    const isControlledByViewer =
      rootPostUri && new AtUri(rootPostUri).host === currentAccount?.did
    return isControlledByViewer && isPostHiddenByThreadgate
      ? [
          {
            type: 'reply-hidden',
            source: {type: 'user', did: currentAccount?.did},
            priority: 6,
          },
        ]
      : []
  }, [post, currentAccount?.did, threadgateHiddenReplies])

  const onPressShowMore = useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  return (
    <ContentHider
      testID="contentHider-post"
      modui={moderation.ui('contentList')}
      ignoreMute
      childContainerStyle={styles.contentHiderChild}>
      <PostAlerts
        modui={moderation.ui('contentList')}
        style={[a.pb_xs]}
        additionalCauses={additionalPostAlerts}
      />
      {richText.text ? (
        <>
          <RichText
            enableTags
            testID="postText"
            value={richText}
            numberOfLines={limitLines ? MAX_POST_LINES : undefined}
            style={[a.flex_1, a.text_md]}
            authorHandle={postAuthor.handle}
            shouldProxyLinks={true}
          />
          {limitLines && (
            <ShowMoreTextButton style={[a.text_md]} onPress={onPressShowMore} />
          )}
        </>
      ) : undefined}
      {postEmbed ? (
        <View style={[a.pb_xs]}>
          <Embed
            embed={postEmbed}
            moderation={moderation}
            onOpen={onOpenEmbed}
            viewContext={PostEmbedViewContext.Feed}
          />
        </View>
      ) : null}
    </ContentHider>
  )
}
PostContent = memo(PostContent)

const styles = StyleSheet.create({
  outer: {
    paddingLeft: 10,
    paddingRight: 15,
    cursor: 'pointer',
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  layout: {
    flexDirection: 'row',
    marginTop: 1,
  },
  layoutAvi: {
    paddingLeft: 8,
    paddingRight: 10,
    position: 'relative',
    zIndex: 999,
  },
  layoutContent: {
    position: 'relative',
    flex: 1,
    zIndex: 0,
  },
  alert: {
    marginTop: 6,
    marginBottom: 6,
  },
  contentHiderChild: {
    marginTop: 6,
  },
  embed: {
    marginBottom: 6,
  },
  translateLink: {
    marginBottom: 6,
  },
})
