import React from 'react'
import {observer} from 'mobx-react-lite'
import {Linking, StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostThreadItemModel} from 'state/models/content/post-thread'
import {Link} from '../util/Link'
import {RichText} from '../util/text/RichText'
import {Text} from '../util/text/Text'
import {PostDropdownBtn} from '../util/forms/DropdownButton'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {ago} from 'lib/strings/time'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {pluralize} from 'lib/strings/helpers'
import {useStores} from 'state/index'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/post-embeds'
import {PostCtrls} from '../util/PostCtrls'
import {PostHider} from '../util/moderation/PostHider'
import {ContentHider} from '../util/moderation/ContentHider'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {usePalette} from 'lib/hooks/usePalette'

const PARENT_REPLY_LINE_LENGTH = 8

export const PostThreadItem = observer(function PostThreadItem({
  item,
  onPostReply,
}: {
  item: PostThreadItemModel
  onPostReply: () => void
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [deleted, setDeleted] = React.useState(false)
  const record = item.postRecord
  const hasEngagement = item.post.likeCount || item.post.repostCount

  const itemUri = item.post.uri
  const itemCid = item.post.cid
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}`
  }, [item.post.uri, item.post.author.handle])
  const itemTitle = `Post by ${item.post.author.handle}`
  const authorHref = `/profile/${item.post.author.handle}`
  const authorTitle = item.post.author.handle
  const likesHref = React.useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}/liked-by`
  }, [item.post.uri, item.post.author.handle])
  const likesTitle = 'Likes on this post'
  const repostsHref = React.useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}/reposted-by`
  }, [item.post.uri, item.post.author.handle])
  const repostsTitle = 'Reposts of this post'

  const onPressReply = React.useCallback(() => {
    store.shell.openComposer({
      replyTo: {
        uri: item.post.uri,
        cid: item.post.cid,
        text: record?.text as string,
        author: {
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
      },
      onPost: onPostReply,
    })
  }, [store, item, record, onPostReply])

  const onPressToggleRepost = React.useCallback(() => {
    return item
      .toggleRepost()
      .catch(e => store.log.error('Failed to toggle repost', e))
  }, [item, store])

  const onPressToggleLike = React.useCallback(() => {
    return item
      .toggleLike()
      .catch(e => store.log.error('Failed to toggle like', e))
  }, [item, store])

  const onCopyPostText = React.useCallback(() => {
    Clipboard.setString(record?.text || '')
    Toast.show('Copied to clipboard')
  }, [record])

  const onOpenTranslate = React.useCallback(() => {
    Linking.openURL(
      encodeURI(`https://translate.google.com/#auto|en|${record?.text || ''}`),
    )
  }, [record])

  const onToggleThreadMute = React.useCallback(async () => {
    try {
      await item.toggleThreadMute()
      if (item.isThreadMuted) {
        Toast.show('You will no longer received notifications for this thread')
      } else {
        Toast.show('You will now receive notifications for this thread')
      }
    } catch (e) {
      store.log.error('Failed to toggle thread mute', e)
    }
  }, [item, store])

  const onDeletePost = React.useCallback(() => {
    item.delete().then(
      () => {
        setDeleted(true)
        Toast.show('Post deleted')
      },
      e => {
        store.log.error('Failed to delete post', e)
        Toast.show('Failed to delete post, please try again')
      },
    )
  }, [item, store])

  if (!record) {
    return <ErrorMessage message="Invalid or unsupported post record" />
  }

  if (deleted) {
    return (
      <View style={[styles.outer, pal.border, pal.view, s.p20, s.flexRow]}>
        <FontAwesomeIcon
          icon={['far', 'trash-can']}
          style={pal.icon as FontAwesomeIconStyle}
        />
        <Text style={[pal.textLight, s.ml10]}>This post has been deleted.</Text>
      </View>
    )
  }

  if (item._isHighlightedPost) {
    return (
      <View
        testID={`postThreadItem-by-${item.post.author.handle}`}
        style={[
          styles.outer,
          styles.outerHighlighted,
          {borderTopColor: pal.colors.border},
          pal.view,
        ]}>
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <Link href={authorHref} title={authorTitle} asAnchor>
              <UserAvatar
                size={52}
                avatar={item.post.author.avatar}
                hasWarning={!!item.post.author.labels?.length}
              />
            </Link>
          </View>
          <View style={styles.layoutContent}>
            <View style={[styles.meta, styles.metaExpandedLine1]}>
              <View style={[s.flexRow, s.alignBaseline]}>
                <Link
                  style={styles.metaItem}
                  href={authorHref}
                  title={authorTitle}>
                  <Text
                    type="xl-bold"
                    style={[pal.text]}
                    numberOfLines={1}
                    lineHeight={1.2}>
                    {sanitizeDisplayName(
                      item.post.author.displayName || item.post.author.handle,
                    )}
                  </Text>
                </Link>
                <Text type="md" style={[styles.metaItem, pal.textLight]}>
                  &middot; {ago(item.post.indexedAt)}
                </Text>
              </View>
              <View style={s.flex1} />
              <PostDropdownBtn
                testID="postDropdownBtn"
                style={styles.metaItem}
                itemUri={itemUri}
                itemCid={itemCid}
                itemHref={itemHref}
                itemTitle={itemTitle}
                isAuthor={item.post.author.did === store.me.did}
                isThreadMuted={item.isThreadMuted}
                onCopyPostText={onCopyPostText}
                onOpenTranslate={onOpenTranslate}
                onToggleThreadMute={onToggleThreadMute}
                onDeletePost={onDeletePost}>
                <FontAwesomeIcon
                  icon="ellipsis-h"
                  size={14}
                  style={[s.mt2, s.mr5, pal.textLight]}
                />
              </PostDropdownBtn>
            </View>
            <View style={styles.meta}>
              <Link
                style={styles.metaItem}
                href={authorHref}
                title={authorTitle}>
                <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                  @{item.post.author.handle}
                </Text>
              </Link>
            </View>
          </View>
        </View>
        <View style={[s.pl10, s.pr10, s.pb10]}>
          <ContentHider
            isMuted={item.post.author.viewer?.muted === true}
            labels={item.post.labels}>
            {item.richText?.text ? (
              <View
                style={[
                  styles.postTextContainer,
                  styles.postTextLargeContainer,
                ]}>
                <RichText
                  type="post-text-lg"
                  richText={item.richText}
                  lineHeight={1.3}
                />
              </View>
            ) : undefined}
            <PostEmbeds embed={item.post.embed} style={s.mb10} />
          </ContentHider>
          {item._isHighlightedPost && hasEngagement ? (
            <View style={[styles.expandedInfo, pal.border]}>
              {item.post.repostCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={repostsHref}
                  title={repostsTitle}>
                  <Text testID="repostCount" type="lg" style={pal.textLight}>
                    <Text type="xl-bold" style={pal.text}>
                      {item.post.repostCount}
                    </Text>{' '}
                    {pluralize(item.post.repostCount, 'repost')}
                  </Text>
                </Link>
              ) : (
                <></>
              )}
              {item.post.likeCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={likesHref}
                  title={likesTitle}>
                  <Text testID="likeCount" type="lg" style={pal.textLight}>
                    <Text type="xl-bold" style={pal.text}>
                      {item.post.likeCount}
                    </Text>{' '}
                    {pluralize(item.post.likeCount, 'like')}
                  </Text>
                </Link>
              ) : (
                <></>
              )}
            </View>
          ) : (
            <></>
          )}
          <View style={[s.pl10, s.pb5]}>
            <PostCtrls
              big
              itemUri={itemUri}
              itemCid={itemCid}
              itemHref={itemHref}
              itemTitle={itemTitle}
              author={{
                avatar: item.post.author.avatar!,
                handle: item.post.author.handle,
                displayName: item.post.author.displayName!,
              }}
              text={item.richText?.text || record.text}
              indexedAt={item.post.indexedAt}
              isAuthor={item.post.author.did === store.me.did}
              isReposted={!!item.post.viewer?.repost}
              isLiked={!!item.post.viewer?.like}
              isThreadMuted={item.isThreadMuted}
              onPressReply={onPressReply}
              onPressToggleRepost={onPressToggleRepost}
              onPressToggleLike={onPressToggleLike}
              onCopyPostText={onCopyPostText}
              onOpenTranslate={onOpenTranslate}
              onToggleThreadMute={onToggleThreadMute}
              onDeletePost={onDeletePost}
            />
          </View>
        </View>
      </View>
    )
  } else {
    return (
      <>
        <PostHider
          testID={`postThreadItem-by-${item.post.author.handle}`}
          href={itemHref}
          style={[styles.outer, {borderColor: pal.colors.border}, pal.view]}
          isMuted={item.post.author.viewer?.muted === true}
          labels={item.post.labels}>
          {item._showParentReplyLine && (
            <View
              style={[
                styles.parentReplyLine,
                {borderColor: pal.colors.replyLine},
              ]}
            />
          )}
          {item._showChildReplyLine && (
            <View
              style={[
                styles.childReplyLine,
                {borderColor: pal.colors.replyLine},
              ]}
            />
          )}
          <View style={styles.layout}>
            <View style={styles.layoutAvi}>
              <Link href={authorHref} title={authorTitle} asAnchor>
                <UserAvatar
                  size={52}
                  avatar={item.post.author.avatar}
                  hasWarning={!!item.post.author.labels?.length}
                />
              </Link>
            </View>
            <View style={styles.layoutContent}>
              <PostMeta
                authorHandle={item.post.author.handle}
                authorDisplayName={item.post.author.displayName}
                authorHasWarning={!!item.post.author.labels?.length}
                timestamp={item.post.indexedAt}
                postHref={itemHref}
                did={item.post.author.did}
              />
              <ContentHider
                labels={item.post.labels}
                containerStyle={styles.contentHider}>
                {item.richText?.text ? (
                  <View style={styles.postTextContainer}>
                    <RichText
                      type="post-text"
                      richText={item.richText}
                      style={pal.text}
                      lineHeight={1.3}
                    />
                  </View>
                ) : undefined}
                <PostEmbeds embed={item.post.embed} style={s.mb10} />
              </ContentHider>
              <PostCtrls
                itemUri={itemUri}
                itemCid={itemCid}
                itemHref={itemHref}
                itemTitle={itemTitle}
                author={{
                  avatar: item.post.author.avatar!,
                  handle: item.post.author.handle,
                  displayName: item.post.author.displayName!,
                }}
                text={item.richText?.text || record.text}
                indexedAt={item.post.indexedAt}
                isAuthor={item.post.author.did === store.me.did}
                replyCount={item.post.replyCount}
                repostCount={item.post.repostCount}
                likeCount={item.post.likeCount}
                isReposted={!!item.post.viewer?.repost}
                isLiked={!!item.post.viewer?.like}
                isThreadMuted={item.isThreadMuted}
                onPressReply={onPressReply}
                onPressToggleRepost={onPressToggleRepost}
                onPressToggleLike={onPressToggleLike}
                onCopyPostText={onCopyPostText}
                onOpenTranslate={onOpenTranslate}
                onToggleThreadMute={onToggleThreadMute}
                onDeletePost={onDeletePost}
              />
            </View>
          </View>
        </PostHider>
        {item._hasMore ? (
          <Link
            style={[
              styles.loadMore,
              {borderTopColor: pal.colors.border},
              pal.view,
            ]}
            href={itemHref}
            title={itemTitle}
            noFeedback>
            <Text style={pal.link}>Continue thread...</Text>
            <FontAwesomeIcon
              icon="angle-right"
              style={pal.link as FontAwesomeIconStyle}
              size={18}
            />
          </Link>
        ) : undefined}
      </>
    )
  }
})

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingLeft: 10,
  },
  outerHighlighted: {
    paddingTop: 2,
    paddingLeft: 6,
    paddingRight: 6,
  },
  parentReplyLine: {
    position: 'absolute',
    left: 44,
    top: -1 * PARENT_REPLY_LINE_LENGTH + 6,
    height: PARENT_REPLY_LINE_LENGTH,
    borderLeftWidth: 2,
  },
  childReplyLine: {
    position: 'absolute',
    left: 44,
    top: 65,
    bottom: 0,
    borderLeftWidth: 2,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 70,
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  meta: {
    flexDirection: 'row',
    paddingTop: 2,
    paddingBottom: 2,
  },
  metaExpandedLine1: {
    paddingTop: 5,
    paddingBottom: 0,
  },
  metaItem: {
    paddingRight: 5,
    maxWidth: 240,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
    paddingRight: 10,
    minHeight: 36,
  },
  postTextLargeContainer: {
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  contentHider: {
    marginTop: 4,
  },
  expandedInfo: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 5,
    marginBottom: 15,
  },
  expandedInfoItem: {
    marginRight: 10,
  },
  loadMore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingLeft: 80,
    paddingRight: 20,
    paddingVertical: 10,
    marginBottom: 8,
  },
})
