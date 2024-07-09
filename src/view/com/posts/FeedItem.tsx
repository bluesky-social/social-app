import React, {memo, useMemo, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {POST_TOMBSTONE, Shadow, usePostShadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useComposerControls} from '#/state/shell/composer'
import {isReasonFeedSource, ReasonFeedSource} from 'lib/api/feed/types'
import {MAX_POST_LINES} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {countLines} from 'lib/strings/helpers'
import {s} from 'lib/styles'
import {precacheProfile} from 'state/queries/profile'
import {atoms as a} from '#/alf'
import {ContentHider} from '#/components/moderation/ContentHider'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import {LabelsOnMyPost} from '../../../components/moderation/LabelsOnMe'
import {PostAlerts} from '../../../components/moderation/PostAlerts'
import {FeedNameText} from '../util/FeedInfoText'
import {Link, TextLink, TextLinkOnWebOnly} from '../util/Link'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {PostMeta} from '../util/PostMeta'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {AviFollowButton} from './AviFollowButton'
import hairlineWidth = StyleSheet.hairlineWidth
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'

interface FeedItemProps {
  record: AppBskyFeedPost.Record
  reason: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource | undefined
  moderation: ModerationDecision
  parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
  showReplyTo: boolean
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
  feedContext: string | undefined
  hideTopBorder?: boolean
  isParentBlocked?: boolean
}

export function FeedItem({
  post,
  record,
  reason,
  feedContext,
  moderation,
  parentAuthor,
  showReplyTo,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
  hideTopBorder,
  isParentBlocked,
}: FeedItemProps & {post: AppBskyFeedDefs.PostView}): React.ReactNode {
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
        richText={richText}
        parentAuthor={parentAuthor}
        showReplyTo={showReplyTo}
        moderation={moderation}
        isThreadChild={isThreadChild}
        isThreadLastChild={isThreadLastChild}
        isThreadParent={isThreadParent}
        hideTopBorder={hideTopBorder}
        isParentBlocked={isParentBlocked}
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
  richText,
  moderation,
  parentAuthor,
  showReplyTo,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
  hideTopBorder,
  isParentBlocked,
}: FeedItemProps & {
  richText: RichTextAPI
  post: Shadow<AppBskyFeedDefs.PostView>
}): React.ReactNode => {
  const queryClient = useQueryClient()
  const {openComposer} = useComposerControls()
  const pal = usePalette('default')
  const {_} = useLingui()
  const href = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const {sendInteraction} = useFeedFeedbackContext()

  const onPressReply = React.useCallback(() => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionReply',
      feedContext,
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
  }, [post, record, openComposer, moderation, sendInteraction, feedContext])

  const onOpenAuthor = React.useCallback(() => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughAuthor',
      feedContext,
    })
  }, [sendInteraction, post, feedContext])

  const onOpenReposter = React.useCallback(() => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughReposter',
      feedContext,
    })
  }, [sendInteraction, post, feedContext])

  const onOpenEmbed = React.useCallback(() => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughEmbed',
      feedContext,
    })
  }, [sendInteraction, post, feedContext])

  const onBeforePress = React.useCallback(() => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#clickthroughItem',
      feedContext,
    })
    precacheProfile(queryClient, post.author)
  }, [queryClient, post, sendInteraction, feedContext])

  const outerStyles = [
    styles.outer,
    {
      borderColor: pal.colors.border,
      paddingBottom:
        isThreadLastChild || (!isThreadChild && !isThreadParent)
          ? 8
          : undefined,
      borderTopWidth: hideTopBorder || isThreadChild ? 0 : hairlineWidth,
    },
  ]

  return (
    <Link
      testID={`feedItem-by-${post.author.handle}`}
      style={outerStyles}
      href={href}
      noFeedback
      accessible={false}
      onBeforePress={onBeforePress}
      dataSet={{feedContext}}>
      <View style={{flexDirection: 'row', gap: 10, paddingLeft: 8}}>
        <View style={{width: 52}}>
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

        <View style={{paddingTop: 12, flexShrink: 1}}>
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
              title={_(
                msg`Reposted by ${sanitizeDisplayName(
                  reason.by.displayName || reason.by.handle,
                )}`,
              )}
              onBeforePress={onOpenReposter}>
              <Repost
                style={{color: pal.colors.textLight, marginRight: 3}}
                width={14}
                height={14}
              />
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans>
                  Reposted by{' '}
                  <ProfileHoverCard inline did={reason.by.did}>
                    <TextLinkOnWebOnly
                      type="sm-bold"
                      style={pal.textLight}
                      lineHeight={1.2}
                      numberOfLines={1}
                      text={sanitizeDisplayName(
                        reason.by.displayName ||
                          sanitizeHandle(reason.by.handle),
                        moderation.ui('displayName'),
                      )}
                      href={makeProfileLink(reason.by)}
                      onBeforePress={onOpenReposter}
                    />
                  </ProfileHoverCard>
                </Trans>
              </Text>
            </Link>
          ) : null}
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <AviFollowButton author={post.author} moderation={moderation}>
            <PreviewableUserAvatar
              size={52}
              profile={post.author}
              moderation={moderation.ui('avatar')}
              type={post.author.associated?.labeler ? 'labeler' : 'user'}
              onBeforePress={onOpenAuthor}
            />
          </AviFollowButton>
          {isThreadParent && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginTop: 4,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            author={post.author}
            moderation={moderation}
            authorHasWarning={!!post.author.labels?.length}
            timestamp={post.indexedAt}
            postHref={href}
            onOpenAuthor={onOpenAuthor}
          />
          {!isThreadChild && showReplyTo && parentAuthor && (
            <ReplyToLabel blocked={isParentBlocked} profile={parentAuthor} />
          )}
          <LabelsOnMyPost post={post} />
          <PostContent
            moderation={moderation}
            richText={richText}
            postEmbed={post.embed}
            postAuthor={post.author}
            onOpenEmbed={onOpenEmbed}
          />
          <PostCtrls
            post={post}
            record={record}
            richText={richText}
            onPressReply={onPressReply}
            logContext="FeedItem"
            feedContext={feedContext}
          />
        </View>
      </View>
    </Link>
  )
}
FeedItemInner = memo(FeedItemInner)

let PostContent = ({
  moderation,
  richText,
  postEmbed,
  postAuthor,
  onOpenEmbed,
}: {
  moderation: ModerationDecision
  richText: RichTextAPI
  postEmbed: AppBskyFeedDefs.PostView['embed']
  postAuthor: AppBskyFeedDefs.PostView['author']
  onOpenEmbed: () => void
}): React.ReactNode => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText.text) >= MAX_POST_LINES,
  )

  const onPressShowMore = React.useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  return (
    <ContentHider
      testID="contentHider-post"
      modui={moderation.ui('contentList')}
      ignoreMute
      childContainerStyle={styles.contentHiderChild}>
      <PostAlerts modui={moderation.ui('contentList')} style={[a.py_2xs]} />
      {richText.text ? (
        <View style={styles.postTextContainer}>
          <RichText
            enableTags
            testID="postText"
            value={richText}
            numberOfLines={limitLines ? MAX_POST_LINES : undefined}
            style={[a.flex_1, a.text_md]}
            authorHandle={postAuthor.handle}
          />
        </View>
      ) : undefined}
      {limitLines ? (
        <TextLink
          text={_(msg`Show More`)}
          style={pal.link}
          onPress={onPressShowMore}
          href="#"
        />
      ) : undefined}
      {postEmbed ? (
        <View style={[a.pb_xs]}>
          <PostEmbeds
            embed={postEmbed}
            moderation={moderation}
            onOpen={onOpenEmbed}
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
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  blocked?: boolean
}) {
  const pal = usePalette('default')
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
        {blocked ? (
          <Trans context="description">Reply to a blocked post</Trans>
        ) : (
          <Trans context="description">
            Reply to{' '}
            <ProfileHoverCard inline did={profile.did}>
              <TextLinkOnWebOnly
                type="md"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}
                href={makeProfileLink(profile)}
                text={
                  profile.displayName
                    ? sanitizeDisplayName(profile.displayName)
                    : sanitizeHandle(profile.handle)
                }
              />
            </ProfileHoverCard>
          </Trans>
        )}
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
    overflow: 'hidden',
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  includeReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    marginLeft: -18,
  },
  layout: {
    flexDirection: 'row',
    marginTop: 1,
    gap: 10,
  },
  layoutAvi: {
    paddingLeft: 8,
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
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 2,
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
