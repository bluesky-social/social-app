import React, {memo, useMemo, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  PostModeration,
  RichText as RichTextAPI,
} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ReasonFeedSource, isReasonFeedSource} from 'lib/api/feed/types'
import {Link, TextLinkOnWebOnly, TextLink} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {ContentHider} from '../util/moderation/ContentHider'
import {PostAlerts} from '../util/moderation/PostAlerts'
import {RichText} from '../util/text/RichText'
import {PostSandboxWarning} from '../util/PostSandboxWarning'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {isEmbedByEmbedder} from 'lib/embeds'
import {MAX_POST_LINES} from 'lib/constants'
import {countLines} from 'lib/strings/helpers'
import {useComposerControls} from '#/state/shell/composer'
import {Shadow, usePostShadow, POST_TOMBSTONE} from '#/state/cache/post-shadow'
import {FeedNameText} from '../util/FeedInfoText'
import {useSession} from '#/state/session'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function FeedItem({
  post,
  record,
  reason,
  moderation,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
}: {
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  reason: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource | undefined
  moderation: PostModeration
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
}) {
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
        post={postShadowed}
        record={record}
        reason={reason}
        richText={richText}
        moderation={moderation}
        isThreadChild={isThreadChild}
        isThreadLastChild={isThreadLastChild}
        isThreadParent={isThreadParent}
      />
    )
  }
  return null
}

let FeedItemInner = ({
  post,
  record,
  reason,
  richText,
  moderation,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  reason: AppBskyFeedDefs.ReasonRepost | ReasonFeedSource | undefined
  richText: RichTextAPI
  moderation: PostModeration
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
}): React.ReactNode => {
  const {openComposer} = useComposerControls()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const href = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const isModeratedPost =
    moderation.decisions.post.cause?.type === 'label' &&
    moderation.decisions.post.cause.label.src !== currentAccount?.did

  const replyAuthorDid = useMemo(() => {
    if (!record?.reply) {
      return ''
    }
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    return urip.hostname
  }, [record?.reply])

  const onPressReply = React.useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text || '',
        author: {
          handle: post.author.handle,
          displayName: post.author.displayName,
          avatar: post.author.avatar,
        },
        embed: post.embed,
        moderation,
      },
    })
  }, [post, record, openComposer, moderation])

  const outerStyles = [
    styles.outer,
    pal.view,
    {
      borderColor: pal.colors.border,
      paddingBottom:
        isThreadLastChild || (!isThreadChild && !isThreadParent)
          ? 6
          : undefined,
    },
    isThreadChild ? styles.outerSmallTop : undefined,
  ]

  return (
    <Link
      testID={`feedItem-by-${post.author.handle}`}
      style={outerStyles}
      href={href}
      noFeedback
      accessible={false}>
      <PostSandboxWarning />

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
              )}>
              <FontAwesomeIcon
                icon="retweet"
                style={{
                  marginRight: 4,
                  color: pal.colors.textLight,
                  minWidth: 16,
                }}
              />
              <Text
                type="sm-bold"
                style={pal.textLight}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans>
                  Reposted by{' '}
                  <TextLinkOnWebOnly
                    type="sm-bold"
                    style={pal.textLight}
                    lineHeight={1.2}
                    numberOfLines={1}
                    text={sanitizeDisplayName(
                      reason.by.displayName || sanitizeHandle(reason.by.handle),
                    )}
                    href={makeProfileLink(reason.by)}
                  />
                </Trans>
              </Text>
            </Link>
          ) : null}
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <PreviewableUserAvatar
            size={52}
            did={post.author.did}
            handle={post.author.handle}
            avatar={post.author.avatar}
            moderation={moderation.avatar}
          />
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
            authorHasWarning={!!post.author.labels?.length}
            timestamp={post.indexedAt}
            postHref={href}
          />
          {!isThreadChild && replyAuthorDid !== '' && (
            <View style={[s.flexRow, s.mb2, s.alignCenter]}>
              <FontAwesomeIcon
                icon="reply"
                size={9}
                style={[
                  {color: pal.colors.textLight} as FontAwesomeIconStyle,
                  s.mr5,
                ]}
              />
              <Text
                type="md"
                style={[pal.textLight, s.mr2]}
                lineHeight={1.2}
                numberOfLines={1}>
                <Trans context="description">
                  Reply to{' '}
                  <UserInfoText
                    type="md"
                    did={replyAuthorDid}
                    attr="displayName"
                    style={[pal.textLight]}
                  />
                </Trans>
              </Text>
            </View>
          )}
          <PostContent
            moderation={moderation}
            richText={richText}
            postEmbed={post.embed}
            postAuthor={post.author}
          />
          <PostCtrls
            post={post}
            record={record}
            richText={richText}
            onPressReply={onPressReply}
            showAppealLabelItem={
              post.author.did === currentAccount?.did && isModeratedPost
            }
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
}: {
  moderation: PostModeration
  richText: RichTextAPI
  postEmbed: AppBskyFeedDefs.PostView['embed']
  postAuthor: AppBskyFeedDefs.PostView['author']
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
      moderation={moderation.content}
      ignoreMute
      childContainerStyle={styles.contentHiderChild}>
      <PostAlerts moderation={moderation.content} style={styles.alert} />
      {richText.text ? (
        <View style={styles.postTextContainer}>
          <RichText
            testID="postText"
            type="post-text"
            richText={richText}
            lineHeight={1.3}
            numberOfLines={limitLines ? MAX_POST_LINES : undefined}
            style={s.flex1}
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
        <ContentHider
          testID="contentHider-embed"
          moderation={moderation.embed}
          moderationDecisions={moderation.decisions}
          ignoreMute={isEmbedByEmbedder(postEmbed, postAuthor.did)}
          ignoreQuoteDecisions
          style={styles.embed}>
          <PostEmbeds
            embed={postEmbed}
            moderation={moderation.embed}
            moderationDecisions={moderation.decisions}
          />
        </ContentHider>
      ) : null}
    </ContentHider>
  )
}
PostContent = memo(PostContent)

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingLeft: 10,
    paddingRight: 15,
    // @ts-ignore web only -prf
    cursor: 'pointer',
    overflow: 'hidden',
  },
  outerSmallTop: {
    borderTopWidth: 0,
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  includeReason: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 2,
    marginLeft: -20,
  },
  layout: {
    flexDirection: 'row',
    marginTop: 1,
    gap: 10,
  },
  layoutAvi: {
    paddingLeft: 8,
  },
  layoutContent: {
    flex: 1,
  },
  alert: {
    marginTop: 6,
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 4,
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
