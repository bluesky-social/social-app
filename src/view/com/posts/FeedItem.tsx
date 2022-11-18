import React, {useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, Text, View} from 'react-native'
import {AtUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FeedItemModel} from '../../../state/models/feed-view'
import {Link} from '../util/Link'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/PostCtrls'
import {RichText} from '../util/RichText'
import Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'
import {useStores} from '../../../state'

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
    store.shell.openComposer({replyTo: {uri: item.uri, cid: item.cid}})
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

  if (deleted) {
    return <View />
  }

  return (
    <Link style={styles.outer} href={itemHref} title={itemTitle}>
      {item.repostedBy && (
        <Link
          style={styles.includeReason}
          href={`/profile/${item.repostedBy.handle}`}
          title={item.repostedBy.displayName || item.repostedBy.handle}>
          <FontAwesomeIcon icon="retweet" style={styles.includeReasonIcon} />
          <Text style={[s.gray4, s.bold, s.f13]}>
            Reposted by {item.repostedBy.displayName || item.repostedBy.handle}
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
            Trending with {item.trendedBy.displayName || item.trendedBy.handle}
          </Text>
        </Link>
      )}
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Link href={authorHref} title={item.author.handle}>
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
          {replyHref !== '' && (
            <View style={[s.flexRow, s.mb5, {alignItems: 'center'}]}>
              <Text style={[s.gray5, s.f15, s.mr2]}>Replying to</Text>
              <Link href={replyHref} title="Parent post">
                <UserInfoText
                  did={replyAuthorDid}
                  style={[s.f15, s.blue3]}
                  prefix="@"
                />
              </Link>
            </View>
          )}
          <View style={styles.postTextContainer}>
            <RichText
              text={record.text}
              entities={record.entities}
              style={styles.postText}
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
})

const styles = StyleSheet.create({
  outer: {
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
    backgroundColor: colors.white,
    padding: 10,
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
    fontFamily: 'Helvetica Neue',
    fontSize: 17,
    lineHeight: 22.1, // 1.3 of 17px
    minHeight: 28,
  },
})
