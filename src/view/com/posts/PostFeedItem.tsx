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
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useActorStatus} from '#/lib/actor-status'
import {isReasonFeedSource, type ReasonFeedSource} from '#/lib/api/feed/types'
import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {countLines} from '#/lib/strings/helpers'
import {s} from '#/lib/styles'
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
import {FeedNameText} from '#/view/com/util/FeedInfoText'
import {Link, TextLinkOnWebOnly} from '#/view/com/util/Link'
import {PostMeta} from '#/view/com/util/PostMeta'
import {Text} from '#/view/com/util/text/Text'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {type AppModerationCause} from '#/components/Pills'
import {Embed} from '#/components/Post/Embed'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls} from '#/components/PostControls'
import {DiscoverDebug} from '#/components/PostControls/DiscoverDebug'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import * as bsky from '#/types/bsky'

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
  const pal = usePalette('default')
  const {_} = useLingui()

  const [hover, setHover] = useState(false)

  const href = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const {sendInteraction, feedDescriptor} = useFeedFeedbackContext()

  const onPressReply = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionReply',
      feedContext,
      reqId,
    })
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text || '',
        author: post.author,
        embed: post.embed,
        moderation,
      },
    })
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
      feed: feedDescriptor,
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

  const {currentAccount} = useSession()
  const isOwner =
    AppBskyFeedDefs.isReasonRepost(reason) &&
    reason.by.did === currentAccount?.did

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
      <SubtleWebHover hover={hover} />
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

        <View style={{paddingTop: 10, flexShrink: 1}}>
          {isReasonFeedSource(reason) ? (
            <Link href={reason.href}>
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans context="from-feed">
                  From{' '}
                  <FeedNameText
                    type="sm-bold"
                    uri={reason.uri}
                    href={reason.href}
                    lineHeight={1.2}
                    numberOfLines={1}
                    style={pal.textLight}
                  />
                </Trans>
              </Text>
            </Link>
          ) : AppBskyFeedDefs.isReasonRepost(reason) ? (
            <Link
              style={styles.includeReason}
              href={makeProfileLink(reason.by)}
              title={
                isOwner
                  ? _(msg`Reposted by you`)
                  : _(
                      msg`Reposted by ${sanitizeDisplayName(
                        reason.by.displayName || reason.by.handle,
                      )}`,
                    )
              }
              onBeforePress={onOpenReposter}>
              <RepostIcon
                style={{color: pal.colors.textLight, marginRight: 3}}
                width={13}
                height={13}
              />
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                {isOwner ? (
                  <Trans>Reposted by you</Trans>
                ) : (
                  <Trans>
                    Reposted by{' '}
                    <ProfileHoverCard did={reason.by.did}>
                      <TextLinkOnWebOnly
                        type="sm-bold"
                        style={pal.textLight}
                        lineHeight={1.2}
                        numberOfLines={1}
                        text={
                          <Text
                            emoji
                            type="sm-bold"
                            style={pal.textLight}
                            lineHeight={1.2}>
                            {sanitizeDisplayName(
                              reason.by.displayName ||
                                sanitizeHandle(reason.by.handle),
                              moderation.ui('displayName'),
                            )}
                          </Text>
                        }
                        href={makeProfileLink(reason.by)}
                        onBeforePress={onOpenReposter}
                      />
                    </ProfileHoverCard>
                  </Trans>
                )}
              </Text>
            </Link>
          ) : AppBskyFeedDefs.isReasonPin(reason) ? (
            <View style={styles.includeReason}>
              <PinIcon
                style={{color: pal.colors.textLight, marginRight: 3}}
                width={13}
                height={13}
              />
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans>Pinned</Trans>
              </Text>
            </View>
          ) : null}
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
              <ReplyToLabel
                blocked={isParentBlocked}
                notFound={isParentNotFound}
                profile={parentAuthor}
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
        style={[a.py_2xs]}
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

function ReplyToLabel({
  profile,
  blocked,
  notFound,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic | undefined
  blocked?: boolean
  notFound?: boolean
}) {
  const pal = usePalette('default')
  const {currentAccount} = useSession()

  let label
  if (blocked) {
    label = <Trans context="description">Reply to a blocked post</Trans>
  } else if (notFound) {
    label = <Trans context="description">Reply to a post</Trans>
  } else if (profile != null) {
    const isMe = profile.did === currentAccount?.did
    if (isMe) {
      label = <Trans context="description">Reply to you</Trans>
    } else {
      label = (
        <Trans context="description">
          Reply to{' '}
          <ProfileHoverCard did={profile.did}>
            <TextLinkOnWebOnly
              type="md"
              style={pal.textLight}
              lineHeight={1.2}
              numberOfLines={1}
              href={makeProfileLink(profile)}
              text={
                <Text emoji type="md" style={pal.textLight} lineHeight={1.2}>
                  {profile.displayName
                    ? sanitizeDisplayName(profile.displayName)
                    : sanitizeHandle(profile.handle)}
                </Text>
              }
            />
          </ProfileHoverCard>
        </Trans>
      )
    }
  }

  if (!label) {
    // Should not happen.
    return null
  }

  return (
    <View style={[s.flexRow, s.mb2, s.alignCenter]}>
      <FontAwesomeIcon
        icon="reply"
        size={9}
        style={[{color: pal.colors.textLight} as FontAwesomeIconStyle, s.mr5]}
      />
      <Text
        type="md"
        style={[pal.textLight, s.mr2]}
        lineHeight={1.2}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    paddingLeft: 10,
    paddingRight: 15,
    // @ts-ignore web only -prf
    cursor: 'pointer',
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  includeReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: -16,
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
