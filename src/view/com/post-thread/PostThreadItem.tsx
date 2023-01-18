import React, {useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '../../../third-party/uri'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewPostModel} from '../../../state/models/post-thread-view'
import {Link} from '../util/Link'
import {RichText} from '../util/text/RichText'
import {Text} from '../util/text/Text'
import {PostDropdownBtn} from '../util/forms/DropdownButton'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s} from '../../lib/styles'
import {ago, pluralize} from '../../../lib/strings'
import {useStores} from '../../../state'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/PostEmbeds'
import {PostCtrls} from '../util/PostCtrls'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ComposePrompt} from '../composer/Prompt'
import {usePalette} from '../../lib/hooks/usePalette'

const PARENT_REPLY_LINE_LENGTH = 8

export const PostThreadItem = observer(function PostThreadItem({
  item,
  onPostReply,
}: {
  item: PostThreadViewPostModel
  onPostReply: () => void
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [deleted, setDeleted] = useState(false)
  const record = item.postRecord
  const hasEngagement = item.post.upvoteCount || item.post.repostCount

  const itemHref = useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}`
  }, [item.post.uri, item.post.author.handle])
  const itemTitle = `Post by ${item.post.author.handle}`
  const authorHref = `/profile/${item.post.author.handle}`
  const authorTitle = item.post.author.handle
  const upvotesHref = useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}/upvoted-by`
  }, [item.post.uri, item.post.author.handle])
  const upvotesTitle = 'Likes on this post'
  const repostsHref = useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}/reposted-by`
  }, [item.post.uri, item.post.author.handle])
  const repostsTitle = 'Reposts of this post'

  const onPressReply = () => {
    store.shell.openComposer({
      replyTo: {
        uri: item.post.uri,
        cid: item.post.cid,
        text: record.text as string,
        author: {
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
      },
      onPost: onPostReply,
    })
  }
  const onPressToggleRepost = () => {
    item
      .toggleRepost()
      .catch(e => store.log.error('Failed to toggle repost', e))
  }
  const onPressToggleUpvote = () => {
    item
      .toggleUpvote()
      .catch(e => store.log.error('Failed to toggle upvote', e))
  }
  const onCopyPostText = () => {
    Clipboard.setString(record.text)
    Toast.show('Copied to clipboard')
  }
  const onDeletePost = () => {
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
  }

  if (!record) {
    return <ErrorMessage message="Invalid or unsupported post record" />
  }

  if (deleted) {
    return (
      <View style={[styles.outer, pal.view, s.p20, s.flexRow]}>
        <FontAwesomeIcon
          icon={['far', 'trash-can']}
          style={{color: pal.colors.icon}}
        />
        <Text style={[pal.textLight, s.ml10]}>This post has been deleted.</Text>
      </View>
    )
  }

  if (item._isHighlightedPost) {
    return (
      <>
        <View
          style={[styles.outer, {borderTopColor: pal.colors.border}, pal.view]}>
          <View style={styles.layout}>
            <View style={styles.layoutAvi}>
              <Link href={authorHref} title={authorTitle}>
                <UserAvatar
                  size={50}
                  displayName={item.post.author.displayName}
                  handle={item.post.author.handle}
                  avatar={item.post.author.avatar}
                />
              </Link>
            </View>
            <View style={styles.layoutContent}>
              <View style={[styles.meta, {paddingTop: 5, paddingBottom: 0}]}>
                <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                  <Link
                    style={styles.metaItem}
                    href={authorHref}
                    title={authorTitle}>
                    <Text type="xl-bold" style={[pal.text]} numberOfLines={1}>
                      {item.post.author.displayName || item.post.author.handle}
                    </Text>
                  </Link>
                  <Text type="md" style={[styles.metaItem, pal.textLight]}>
                    &middot; {ago(item.post.indexedAt)}
                  </Text>
                </View>
                <View style={s.flex1} />
                <PostDropdownBtn
                  style={styles.metaItem}
                  itemHref={itemHref}
                  itemTitle={itemTitle}
                  isAuthor={item.post.author.did === store.me.did}
                  onCopyPostText={onCopyPostText}
                  onDeletePost={onDeletePost}>
                  <FontAwesomeIcon
                    icon="ellipsis-h"
                    size={14}
                    style={[s.mt2, s.mr5]}
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
            {record.text ? (
              <View
                style={[
                  styles.postTextContainer,
                  styles.postTextLargeContainer,
                ]}>
                <RichText
                  type="post-text-lg"
                  text={record.text}
                  entities={record.entities}
                  lineHeight={1.3}
                />
              </View>
            ) : undefined}
            <PostEmbeds embed={item.post.embed} style={s.mb10} />
            {item._isHighlightedPost && hasEngagement ? (
              <View style={[styles.expandedInfo, pal.border]}>
                {item.post.repostCount ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={repostsHref}
                    title={repostsTitle}>
                    <Text type="lg" style={pal.textLight}>
                      <Text type="xl-bold" style={pal.text}>
                        {item.post.repostCount}
                      </Text>{' '}
                      {pluralize(item.post.repostCount, 'repost')}
                    </Text>
                  </Link>
                ) : (
                  <></>
                )}
                {item.post.upvoteCount ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={upvotesHref}
                    title={upvotesTitle}>
                    <Text type="lg" style={pal.textLight}>
                      <Text type="xl-bold" style={pal.text}>
                        {item.post.upvoteCount}
                      </Text>{' '}
                      {pluralize(item.post.upvoteCount, 'like')}
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
                itemHref={itemHref}
                itemTitle={itemTitle}
                isAuthor={item.post.author.did === store.me.did}
                isReposted={!!item.post.viewer.repost}
                isUpvoted={!!item.post.viewer.upvote}
                onPressReply={onPressReply}
                onPressToggleRepost={onPressToggleRepost}
                onPressToggleUpvote={onPressToggleUpvote}
                onCopyPostText={onCopyPostText}
                onDeletePost={onDeletePost}
              />
            </View>
          </View>
        </View>
        <ComposePrompt
          isReply
          text="Write your reply"
          btn="Reply"
          onPressCompose={onPressReply}
        />
      </>
    )
  } else {
    return (
      <>
        <Link
          style={[styles.outer, {borderTopColor: pal.colors.border}, pal.view]}
          href={itemHref}
          title={itemTitle}
          noFeedback>
          {record.reply && (
            <View
              style={[
                styles.parentReplyLine,
                {borderColor: pal.colors.replyLine},
              ]}
            />
          )}
          {item.replies?.length !== 0 && (
            <View
              style={[
                styles.childReplyLine,
                {borderColor: pal.colors.replyLine},
              ]}
            />
          )}
          <View style={styles.layout}>
            <View style={styles.layoutAvi}>
              <Link href={authorHref} title={authorTitle}>
                <UserAvatar
                  size={50}
                  displayName={item.post.author.displayName}
                  handle={item.post.author.handle}
                  avatar={item.post.author.avatar}
                />
              </Link>
            </View>
            <View style={styles.layoutContent}>
              <PostMeta
                authorHandle={item.post.author.handle}
                authorDisplayName={item.post.author.displayName}
                timestamp={item.post.indexedAt}
              />
              {item.post.author.viewer?.muted ? (
                <View style={[styles.mutedWarning, pal.btn]}>
                  <FontAwesomeIcon icon={['far', 'eye-slash']} style={s.mr2} />
                  <Text type="sm">This post is by a muted account.</Text>
                </View>
              ) : record.text ? (
                <View style={styles.postTextContainer}>
                  <RichText
                    type="post-text"
                    text={record.text}
                    entities={record.entities}
                    style={pal.text}
                    lineHeight={1.3}
                  />
                </View>
              ) : (
                <View style={{height: 5}} />
              )}
              <PostEmbeds embed={item.post.embed} style={{marginBottom: 10}} />
              <PostCtrls
                itemHref={itemHref}
                itemTitle={itemTitle}
                isAuthor={item.post.author.did === store.me.did}
                replyCount={item.post.replyCount}
                repostCount={item.post.repostCount}
                upvoteCount={item.post.upvoteCount}
                isReposted={!!item.post.viewer.repost}
                isUpvoted={!!item.post.viewer.upvote}
                onPressReply={onPressReply}
                onPressToggleRepost={onPressToggleRepost}
                onPressToggleUpvote={onPressToggleUpvote}
                onCopyPostText={onCopyPostText}
                onDeletePost={onDeletePost}
              />
            </View>
          </View>
        </Link>
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
            <Text style={pal.link}>Load more</Text>
          </Link>
        ) : undefined}
      </>
    )
  }
})

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
  },
  parentReplyLine: {
    position: 'absolute',
    left: 34,
    top: -1 * PARENT_REPLY_LINE_LENGTH + 6,
    height: PARENT_REPLY_LINE_LENGTH,
    borderLeftWidth: 2,
  },
  childReplyLine: {
    position: 'absolute',
    left: 34,
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
  metaItem: {
    paddingRight: 5,
    maxWidth: 240,
  },
  mutedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 2,
    marginBottom: 6,
    borderRadius: 2,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
    paddingRight: 20,
    minHeight: 36,
  },
  postTextLargeContainer: {
    paddingLeft: 4,
    paddingBottom: 20,
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
    borderTopWidth: 1,
    paddingLeft: 28,
    paddingVertical: 10,
  },
})
