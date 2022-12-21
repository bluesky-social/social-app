import React, {useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewPostModel} from '../../../state/models/post-thread-view'
import {Link} from '../util/Link'
import {RichText} from '../util/RichText'
import {Text} from '../util/Text'
import {PostDropdownBtn} from '../util/DropdownBtn'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'
import {ago, pluralize} from '../../../lib/strings'
import {useStores} from '../../../state'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/PostEmbeds'
import {PostCtrls} from '../util/PostCtrls'
import {ComposePrompt} from '../composer/Prompt'

const PARENT_REPLY_LINE_LENGTH = 8
const REPLYING_TO_LINE_LENGTH = 6

export const PostThreadItem = observer(function PostThreadItem({
  item,
  onPostReply,
}: {
  item: PostThreadViewPostModel
  onPostReply: () => void
}) {
  const store = useStores()
  const [deleted, setDeleted] = useState(false)
  const record = item.post.record as unknown as PostType.Record
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
  const upvotesTitle = 'Upvotes on this post'
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
      .catch(e => console.error('Failed to toggle repost', record, e))
  }
  const onPressToggleUpvote = () => {
    item
      .toggleUpvote()
      .catch(e => console.error('Failed to toggle upvote', record, e))
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
        console.error(e)
        Toast.show('Failed to delete post, please try again')
      },
    )
  }

  if (deleted) {
    return (
      <View style={[styles.outer, s.p20, s.flexRow]}>
        <FontAwesomeIcon icon={['far', 'trash-can']} style={[s.gray4]} />
        <Text style={[s.gray5, s.ml10]}>This post has been deleted.</Text>
      </View>
    )
  }

  if (item._isHighlightedPost) {
    return (
      <>
        <View style={styles.outer}>
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
                <Link
                  style={styles.metaItem}
                  href={authorHref}
                  title={authorTitle}>
                  <Text style={[s.f16, s.bold, s.black]} numberOfLines={1}>
                    {item.post.author.displayName || item.post.author.handle}
                  </Text>
                </Link>
                <Text style={[styles.metaItem, s.f15, s.gray5]}>
                  &middot; {ago(item.post.indexedAt)}
                </Text>
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
                  <Text style={[s.f15, s.gray5]} numberOfLines={1}>
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
                  text={record.text}
                  entities={record.entities}
                  style={[styles.postText, styles.postTextLarge]}
                />
              </View>
            ) : undefined}
            <PostEmbeds embed={item.post.embed} style={s.mb10} />
            {item._isHighlightedPost && hasEngagement ? (
              <View style={styles.expandedInfo}>
                {item.post.repostCount ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={repostsHref}
                    title={repostsTitle}>
                    <Text style={[s.gray5, s.semiBold, s.f17]}>
                      <Text style={[s.bold, s.black, s.f17]}>
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
                    <Text style={[s.gray5, s.semiBold, s.f17]}>
                      <Text style={[s.bold, s.black, s.f17]}>
                        {item.post.upvoteCount}
                      </Text>{' '}
                      {pluralize(item.post.upvoteCount, 'upvote')}
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
                isReposted={!!item.post.viewer.repost}
                isUpvoted={!!item.post.viewer.upvote}
                onPressReply={onPressReply}
                onPressToggleRepost={onPressToggleRepost}
                onPressToggleUpvote={onPressToggleUpvote}
              />
            </View>
          </View>
        </View>
        <ComposePrompt
          noAvi
          text="Write your reply"
          btn="Reply"
          onPressCompose={onPressReply}
        />
      </>
    )
  } else {
    return (
      <>
        <Link style={styles.outer} href={itemHref} title={itemTitle} noFeedback>
          {!item.replyingTo && record.reply && (
            <View style={styles.parentReplyLine} />
          )}
          {item.replies?.length !== 0 && <View style={styles.childReplyLine} />}
          {item.replyingTo ? (
            <View style={styles.replyingTo}>
              <View style={styles.replyingToLine} />
              <View style={styles.replyingToAvatar}>
                <UserAvatar
                  handle={item.replyingTo.author.handle}
                  displayName={item.replyingTo.author.displayName}
                  avatar={item.replyingTo.author.avatar}
                  size={30}
                />
              </View>
              <Text style={styles.replyingToText} numberOfLines={2}>
                {item.replyingTo.text}
              </Text>
            </View>
          ) : undefined}
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
                itemHref={itemHref}
                itemTitle={itemTitle}
                authorHref={authorHref}
                authorHandle={item.post.author.handle}
                authorDisplayName={item.post.author.displayName}
                timestamp={item.post.indexedAt}
                isAuthor={item.post.author.did === store.me.did}
                onCopyPostText={onCopyPostText}
                onDeletePost={onDeletePost}
              />
              {record.text ? (
                <View style={styles.postTextContainer}>
                  <RichText
                    text={record.text}
                    entities={record.entities}
                    style={[styles.postText]}
                  />
                </View>
              ) : (
                <View style={{height: 5}} />
              )}
              <PostEmbeds embed={item.post.embed} style={{marginBottom: 10}} />
              <PostCtrls
                replyCount={item.post.replyCount}
                repostCount={item.post.repostCount}
                upvoteCount={item.post.upvoteCount}
                isReposted={!!item.post.viewer.repost}
                isUpvoted={!!item.post.viewer.upvote}
                onPressReply={onPressReply}
                onPressToggleRepost={onPressToggleRepost}
                onPressToggleUpvote={onPressToggleUpvote}
              />
            </View>
          </View>
        </Link>
        {item._hasMore ? (
          <Link
            style={styles.loadMore}
            href={itemHref}
            title={itemTitle}
            noFeedback>
            <Text style={styles.loadMoreText}>Load more</Text>
          </Link>
        ) : undefined}
      </>
    )
  }
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
  },
  parentReplyLine: {
    position: 'absolute',
    left: 34,
    top: -1 * PARENT_REPLY_LINE_LENGTH + 6,
    height: PARENT_REPLY_LINE_LENGTH,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  childReplyLine: {
    position: 'absolute',
    left: 34,
    top: 65,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  replyingToLine: {
    position: 'absolute',
    left: 34,
    bottom: -1 * REPLYING_TO_LINE_LENGTH,
    height: REPLYING_TO_LINE_LENGTH,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  replyingTo: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingLeft: 8,
    paddingTop: 12,
    paddingBottom: 0,
    paddingRight: 24,
  },
  replyingToAvatar: {
    marginLeft: 12,
    marginRight: 20,
  },
  replyingToText: {
    flex: 1,
    color: colors.gray5,
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
  postText: {
    fontFamily: 'System',
    fontSize: 16,
    lineHeight: 20.8, // 1.3 of 16px
    color: 'black',
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
    minHeight: 36,
  },
  postTextLarge: {
    fontSize: 24,
    lineHeight: 32,
  },
  postTextLargeContainer: {
    paddingLeft: 4,
    paddingBottom: 20,
  },
  expandedInfo: {
    flexDirection: 'row',
    padding: 10,
    borderColor: colors.gray2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 5,
    marginBottom: 15,
  },
  expandedInfoItem: {
    marginRight: 10,
  },
  loadMore: {
    paddingLeft: 28,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
  },
  loadMoreText: {
    fontSize: 17,
    color: colors.blue3,
  },
})
