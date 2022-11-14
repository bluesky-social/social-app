import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, Text, View} from 'react-native'
import {AtUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FeedItemModel} from '../../../state/models/feed-view'
import {SharePostModel} from '../../../state/models/shell-ui'
import {Link} from '../util/Link'
import {PostDropdownBtn} from '../util/DropdownBtn'
import {UserInfoText} from '../util/UserInfoText'
import {PostCtrls} from '../util/PostCtrls'
import {RichText} from '../util/RichText'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'
import {ago} from '../../lib/strings'
import {useStores} from '../../../state'

export const FeedItem = observer(function FeedItem({
  item,
}: {
  item: FeedItemModel
}) {
  const store = useStores()
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
  const onPressShare = (uri: string) => {
    store.shell.openModal(new SharePostModel(uri))
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
        <Link
          style={styles.layoutAvi}
          href={authorHref}
          title={item.author.handle}>
          <UserAvatar
            size={50}
            displayName={item.author.displayName}
            handle={item.author.handle}
          />
        </Link>
        <View style={styles.layoutContent}>
          <View style={styles.meta}>
            <Link
              style={styles.metaItem}
              href={authorHref}
              title={item.author.handle}>
              <Text style={[s.f17, s.bold]}>
                {item.author.displayName || item.author.handle}
              </Text>
            </Link>
            <Link
              style={styles.metaItem}
              href={authorHref}
              title={item.author.handle}>
              <Text style={[s.f15, s.gray5]}>@{item.author.handle}</Text>
            </Link>
            <Text style={[styles.metaItem, s.f15, s.gray5]}>
              &middot; {ago(item.indexedAt)}
            </Text>
            <View style={s.flex1} />
            <PostDropdownBtn
              style={styles.metaItem}
              itemHref={itemHref}
              itemTitle={itemTitle}>
              <FontAwesomeIcon
                icon="ellipsis-h"
                size={14}
                style={[s.mt2, s.mr5]}
              />
            </PostDropdownBtn>
          </View>
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
              style={[s.f17, s['lh17-1.3']]}
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
  meta: {
    flexDirection: 'row',
    paddingTop: 2,
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 5,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  postText: {
    fontFamily: 'Helvetica Neue',
  },
})
