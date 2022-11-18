import React, {useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, Text, View} from 'react-native'
import Svg, {Line} from 'react-native-svg'
import {AtUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewPostModel} from '../../../state/models/post-thread-view'
import {Link} from '../util/Link'
import {RichText} from '../util/RichText'
import {PostDropdownBtn} from '../util/DropdownBtn'
import Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'
import {ago, pluralize} from '../../lib/strings'
import {useStores} from '../../../state'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/PostCtrls'

const PARENT_REPLY_LINE_LENGTH = 8

export const PostThreadItem = observer(function PostThreadItem({
  item,
  onPressShare,
  onPostReply,
}: {
  item: PostThreadViewPostModel
  onPressShare: (_uri: string) => void
  onPostReply: () => void
}) {
  const store = useStores()
  const [deleted, setDeleted] = useState(false)
  const record = item.record as unknown as PostType.Record
  const hasEngagement =
    item.upvoteCount || item.downvoteCount || item.repostCount

  const itemHref = useMemo(() => {
    const urip = new AtUri(item.uri)
    return `/profile/${item.author.handle}/post/${urip.rkey}`
  }, [item.uri, item.author.handle])
  const itemTitle = `Post by ${item.author.handle}`
  const authorHref = `/profile/${item.author.handle}`
  const authorTitle = item.author.handle
  const upvotesHref = useMemo(() => {
    const urip = new AtUri(item.uri)
    return `/profile/${item.author.handle}/post/${urip.rkey}/upvoted-by`
  }, [item.uri, item.author.handle])
  const upvotesTitle = 'Upvotes on this post'
  const downvotesHref = useMemo(() => {
    const urip = new AtUri(item.uri)
    return `/profile/${item.author.handle}/post/${urip.rkey}/downvoted-by`
  }, [item.uri, item.author.handle])
  const downvotesTitle = 'Downvotes on this post'
  const repostsHref = useMemo(() => {
    const urip = new AtUri(item.uri)
    return `/profile/${item.author.handle}/post/${urip.rkey}/reposted-by`
  }, [item.uri, item.author.handle])
  const repostsTitle = 'Reposts of this post'

  const onPressReply = () => {
    store.shell.openComposer({
      replyTo: {uri: item.uri, cid: item.cid},
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
  const onPressToggleDownvote = () => {
    item
      .toggleDownvote()
      .catch(e => console.error('Failed to toggle downvote', record, e))
  }
  const onDeletePost = () => {
    item.delete().then(
      () => {
        setDeleted(true)
        Toast.show('Post deleted', {
          position: Toast.positions.TOP,
        })
      },
      e => {
        console.error(e)
        Toast.show('Failed to delete post, please try again', {
          position: Toast.positions.TOP,
        })
      },
    )
  }

  if (item._isHighlightedPost) {
    return (
      <View style={styles.outer}>
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <Link href={authorHref} title={authorTitle}>
              <UserAvatar
                size={50}
                displayName={item.author.displayName}
                handle={item.author.handle}
              />
            </Link>
          </View>
          <View style={styles.layoutContent}>
            <View style={[styles.meta, {paddingTop: 5, paddingBottom: 0}]}>
              <Link
                style={styles.metaItem}
                href={authorHref}
                title={authorTitle}>
                <Text style={[s.f16, s.bold]} numberOfLines={1}>
                  {item.author.displayName || item.author.handle}
                </Text>
              </Link>
              <Text style={[styles.metaItem, s.f15, s.gray5]}>
                &middot; {ago(item.indexedAt)}
              </Text>
              <View style={s.flex1} />
              <PostDropdownBtn
                style={styles.metaItem}
                itemHref={itemHref}
                itemTitle={itemTitle}
                isAuthor={item.author.did === store.me.did}
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
                  @{item.author.handle}
                </Text>
              </Link>
            </View>
          </View>
        </View>
        <View style={[s.pl10, s.pr10, s.pb10]}>
          <View
            style={[styles.postTextContainer, styles.postTextLargeContainer]}>
            <RichText
              text={record.text}
              entities={record.entities}
              style={[styles.postText, styles.postTextLarge]}
            />
          </View>
          {item._isHighlightedPost && hasEngagement ? (
            <View style={styles.expandedInfo}>
              {item.repostCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={repostsHref}
                  title={repostsTitle}>
                  <Text style={[s.gray5, s.semiBold, s.f16]}>
                    <Text style={[s.bold, s.black, s.f16]}>
                      {item.repostCount}
                    </Text>{' '}
                    {pluralize(item.repostCount, 'repost')}
                  </Text>
                </Link>
              ) : (
                <></>
              )}
              {item.upvoteCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={upvotesHref}
                  title={upvotesTitle}>
                  <Text style={[s.gray5, s.semiBold, s.f16]}>
                    <Text style={[s.bold, s.black, s.f16]}>
                      {item.upvoteCount}
                    </Text>{' '}
                    {pluralize(item.upvoteCount, 'upvote')}
                  </Text>
                </Link>
              ) : (
                <></>
              )}
              {item.downvoteCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={downvotesHref}
                  title={downvotesTitle}>
                  <Text style={[s.gray5, s.semiBold, s.f16]}>
                    <Text style={[s.bold, s.black, s.f16]}>
                      {item.downvoteCount}
                    </Text>{' '}
                    {pluralize(item.downvoteCount, 'downvote')}
                  </Text>
                </Link>
              ) : (
                <></>
              )}
            </View>
          ) : (
            <></>
          )}
          <View style={[s.pl10]}>
            <PostCtrls
              replyCount={item.replyCount}
              repostCount={item.repostCount}
              upvoteCount={item.upvoteCount}
              downvoteCount={item.downvoteCount}
              isReposted={!!item.myState.repost}
              isUpvoted={!!item.myState.upvote}
              isDownvoted={!!item.myState.downvote}
              onPressReply={onPressReply}
              onPressToggleRepost={onPressToggleRepost}
              onPressToggleUpvote={onPressToggleUpvote}
              onPressToggleDownvote={onPressToggleDownvote}
            />
          </View>
        </View>
      </View>
    )
  } else {
    return (
      <Link style={styles.outer} href={itemHref} title={itemTitle}>
        {!!item.replyingToAuthor && (
          <View style={styles.parentReplyLine}>
            <Svg width="10" height={PARENT_REPLY_LINE_LENGTH}>
              <Line
                x1="5"
                x2="5"
                y1="0"
                y2={PARENT_REPLY_LINE_LENGTH}
                stroke={colors.gray2}
                strokeWidth={2}
              />
            </Svg>
          </View>
        )}
        {item.replies?.length !== 0 && (
          <View style={styles.childReplyLine}>
            <Svg width="10" height={100}>
              <Line
                x1="5"
                x2="5"
                y1="0"
                y2={100}
                stroke={colors.gray2}
                strokeWidth={2}
              />
            </Svg>
          </View>
        )}
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <Link href={authorHref} title={authorTitle}>
              <UserAvatar
                size={50}
                displayName={item.author.displayName}
                handle={item.author.handle}
              />
            </Link>
          </View>
          <View style={styles.layoutContent}>
            <PostMeta
              itemHref={itemHref}
              itemTitle={itemTitle}
              authorHref={authorHref}
              authorHandle={item.author.handle}
              authorDisplayName={item.author.displayName}
              timestamp={item.indexedAt}
              isAuthor={item.author.did === store.me.did}
              onDeletePost={onDeletePost}
            />
            {item.replyingToAuthor &&
              item.replyingToAuthor !== item.author.handle && (
                <View style={[s.flexRow, s.mb5, {alignItems: 'center'}]}>
                  <Text style={[s.gray5, s.f15, s.mr2]}>Replying to</Text>
                  <Link
                    href={`/profile/${item.replyingToAuthor}`}
                    title={`@${item.replyingToAuthor}`}>
                    <Text style={[s.f14, s.blue3]}>
                      @{item.replyingToAuthor}
                    </Text>
                  </Link>
                </View>
              )}
            <View style={styles.postTextContainer}>
              <RichText
                text={record.text}
                entities={record.entities}
                style={[styles.postText, s.f17, s['lh17-1.3']]}
              />
            </View>
            <PostCtrls
              replyCount={item.replyCount}
              repostCount={item.repostCount}
              upvoteCount={item.upvoteCount}
              downvoteCount={item.downvoteCount}
              isReposted={!!item.myState.repost}
              isUpvoted={!!item.myState.upvote}
              isDownvoted={!!item.myState.downvote}
              onPressReply={onPressReply}
              onPressToggleRepost={onPressToggleRepost}
              onPressToggleUpvote={onPressToggleUpvote}
              onPressToggleDownvote={onPressToggleDownvote}
            />
          </View>
        </View>
      </Link>
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
    left: 30,
    top: -1 * PARENT_REPLY_LINE_LENGTH + 6,
  },
  childReplyLine: {
    position: 'absolute',
    left: 30,
    top: 65,
    bottom: 0,
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
    fontFamily: 'Helvetica Neue',
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  postTextLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '300',
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
    marginBottom: 10,
  },
  expandedInfoItem: {
    marginRight: 10,
  },
})
