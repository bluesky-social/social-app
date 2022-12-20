import React, {useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Svg, {Circle, Line} from 'react-native-svg'
import {AtUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FeedItemModel} from '../../../state/models/feed-view'
import {Link} from '../util/Link'
import {Text} from '../util/Text'
import {UserInfoText} from '../util/UserInfoText'
import {Post} from '../post/Post'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/PostCtrls'
import {PostEmbeds} from '../util/PostEmbeds'
import {RichText} from '../util/RichText'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'
import {useStores} from '../../../state'

const TOP_REPLY_LINE_LENGTH = 8

export const FeedItem = observer(function FeedItem({
  item,
}: {
  item: FeedItemModel
}) {
  const store = useStores()
  const [deleted, setDeleted] = useState(false)
  const record = item.record as unknown as PostType.Record
  const itemHref = useMemo(() => {
    const urip = new AtUri(item.uri)
    return `/profile/${item.author.handle}/post/${urip.rkey}`
  }, [item.uri, item.author.handle])
  const itemTitle = `Post by ${item.author.handle}`
  const authorHref = `/profile/${item.author.handle}`
  const replyAuthorDid = useMemo(() => {
    if (!record.reply) return ''
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    return urip.hostname
  }, [record.reply])
  const replyHref = useMemo(() => {
    if (!record.reply) return ''
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    return `/profile/${urip.hostname}/post/${urip.rkey}`
  }, [record.reply])

  const onPressReply = () => {
    store.shell.openComposer({
      replyTo: {
        uri: item.uri,
        cid: item.cid,
        text: item.record.text as string,
        author: {
          handle: item.author.handle,
          displayName: item.author.displayName,
          avatar: item.author.avatar,
        },
      },
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
    return <View />
  }

  const isChild =
    item._isThreadChild ||
    (!item.repostedBy && !item.trendedBy && item.additionalParentPost?.thread)
  const outerStyles = [
    styles.outer,
    isChild
      ? item._isThreadChild
        ? styles.outerSmallTop
        : styles.outerNoTop
      : undefined,
    item._isThreadParent ? styles.outerNoBottom : undefined,
  ]
  return (
    <>
      {isChild && item.additionalParentPost?.thread ? (
        <Post
          uri={item.additionalParentPost.thread.uri}
          initView={item.additionalParentPost}
          showReplyLine
          style={{marginTop: 2}}
        />
      ) : undefined}
      <Link style={outerStyles} href={itemHref} title={itemTitle} noFeedback>
        {isChild && <View style={[styles.topReplyLine]} />}
        {item._isThreadParent && <View style={[styles.bottomReplyLine]} />}
        {item.repostedBy && (
          <Link
            style={styles.includeReason}
            href={`/profile/${item.repostedBy.handle}`}
            title={item.repostedBy.displayName || item.repostedBy.handle}>
            <FontAwesomeIcon icon="retweet" style={styles.includeReasonIcon} />
            <Text style={[s.gray4, s.bold, s.f13]}>
              Reposted by{' '}
              {item.repostedBy.displayName || item.repostedBy.handle}
            </Text>
          </Link>
        )}
        {item.trendedBy && (
          <Link
            style={styles.includeReason}
            href={`/profile/${item.trendedBy.handle}`}
            title={item.trendedBy.displayName || item.trendedBy.handle}>
            <FontAwesomeIcon
              icon="arrow-trend-up"
              style={styles.includeReasonIcon}
            />
            <Text style={[s.gray4, s.bold, s.f13]}>
              Trending with{' '}
              {item.trendedBy.displayName || item.trendedBy.handle}
            </Text>
          </Link>
        )}
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <Link href={authorHref} title={item.author.handle}>
              <UserAvatar
                size={52}
                displayName={item.author.displayName}
                handle={item.author.handle}
                avatar={item.author.avatar}
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
              onCopyPostText={onCopyPostText}
              onDeletePost={onDeletePost}
            />
            {!isChild && replyHref !== '' && (
              <View style={[s.flexRow, s.mb2, {alignItems: 'center'}]}>
                <FontAwesomeIcon
                  icon="reply"
                  size={9}
                  style={[s.gray4, s.mr5]}
                />
                <Text style={[s.gray4, s.f12, s.mr2]}>Reply to</Text>
                <Link href={replyHref} title="Parent post">
                  <UserInfoText
                    did={replyAuthorDid}
                    style={[s.f12, s.gray5]}
                    prefix="@"
                  />
                </Link>
              </View>
            )}
            {record.text ? (
              <View style={styles.postTextContainer}>
                <RichText
                  text={record.text}
                  entities={record.entities}
                  style={styles.postText}
                />
              </View>
            ) : (
              <View style={{height: 5}} />
            )}
            <PostEmbeds embed={item.embed} style={styles.postEmbeds} />
            <PostCtrls
              replyCount={item.replyCount}
              repostCount={item.repostCount}
              upvoteCount={item.upvoteCount}
              isReposted={!!item.myState.repost}
              isUpvoted={!!item.myState.upvote}
              onPressReply={onPressReply}
              onPressToggleRepost={onPressToggleRepost}
              onPressToggleUpvote={onPressToggleUpvote}
            />
          </View>
        </View>
      </Link>
      {item._isThreadChildElided ? (
        <Link
          style={styles.viewFullThread}
          href={itemHref}
          title={itemTitle}
          noFeedback>
          <View style={styles.viewFullThreadDots}>
            <Svg width="4" height="30">
              <Line
                x1="2"
                y1="0"
                x2="2"
                y2="5"
                stroke={colors.gray2}
                strokeWidth="2"
              />
              <Circle x="2" y="10" r="1.5" fill={colors.gray3} />
              <Circle x="2" y="16" r="1.5" fill={colors.gray3} />
              <Circle x="2" y="22" r="1.5" fill={colors.gray3} />
            </Svg>
          </View>
          <Text style={styles.viewFullThreadText}>View full thread</Text>
        </Link>
      ) : undefined}
    </>
  )
})

const styles = StyleSheet.create({
  outer: {
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
    backgroundColor: colors.white,
    padding: 10,
  },
  outerNoTop: {
    marginTop: 0,
    paddingTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  outerSmallTop: {
    marginTop: 0,
    paddingTop: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  outerNoBottom: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  topReplyLine: {
    position: 'absolute',
    left: 34,
    top: -1 * TOP_REPLY_LINE_LENGTH,
    height: TOP_REPLY_LINE_LENGTH,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  bottomReplyLine: {
    position: 'absolute',
    left: 34,
    top: 60,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  includeReason: {
    flexDirection: 'row',
    paddingLeft: 60,
  },
  includeReasonIcon: {
    marginRight: 4,
    color: colors.gray4,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 60,
    paddingTop: 5,
  },
  layoutContent: {
    flex: 1,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  postText: {
    fontFamily: 'System',
    fontSize: 16,
    lineHeight: 20.8, // 1.3 of 16px
    color: colors.black,
  },
  postEmbeds: {
    marginBottom: 10,
  },
  viewFullThread: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 4,
    paddingLeft: 72,
  },
  viewFullThreadDots: {
    position: 'absolute',
    left: 35,
    top: 0,
  },
  viewFullThreadText: {
    color: colors.blue3,
    fontSize: 16,
  },
})
