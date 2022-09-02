import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {bsky, AdxUri} from '@adxp/mock-api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewPostModel} from '../../../state/models/post-thread-view'
import {Link} from '../util/Link'
import {s, colors} from '../../lib/styles'
import {ago, pluralize} from '../../lib/strings'
import {AVIS} from '../../lib/assets'
import {useStores} from '../../../state'

export const PostThreadItem = observer(function PostThreadItem({
  item,
  onPressShare,
}: {
  item: PostThreadViewPostModel
  onPressShare: (_uri: string) => void
}) {
  const store = useStores()
  const record = item.record as unknown as bsky.Post.Record
  const hasEngagement = item.likeCount || item.repostCount

  const itemHref = useMemo(() => {
    const urip = new AdxUri(item.uri)
    return `/profile/${item.author.name}/post/${urip.recordKey}`
  }, [item.uri, item.author.name])
  const itemTitle = `Post by ${item.author.name}`
  const authorHref = `/profile/${item.author.name}`
  const authorTitle = item.author.name
  const likesHref = useMemo(() => {
    const urip = new AdxUri(item.uri)
    return `/profile/${item.author.name}/post/${urip.recordKey}/liked-by`
  }, [item.uri, item.author.name])
  const likesTitle = 'Likes on this post'
  const repostsHref = useMemo(() => {
    const urip = new AdxUri(item.uri)
    return `/profile/${item.author.name}/post/${urip.recordKey}/reposted-by`
  }, [item.uri, item.author.name])
  const repostsTitle = 'Reposts of this post'

  const onPressReply = () => {
    store.nav.navigate(`/composer?replyTo=${item.uri}`)
  }
  const onPressToggleRepost = () => {
    item
      .toggleRepost()
      .catch(e => console.error('Failed to toggle repost', record, e))
  }
  const onPressToggleLike = () => {
    item
      .toggleLike()
      .catch(e => console.error('Failed to toggle like', record, e))
  }

  const Ctrls = () => (
    <View style={styles.ctrls}>
      <TouchableOpacity style={styles.ctrl} onPress={onPressReply}>
        <FontAwesomeIcon
          style={styles.ctrlIcon}
          icon={['far', 'comment']}
          size={14}
        />
        <Text style={s.f13}>{item.replyCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ctrl} onPress={onPressToggleRepost}>
        <FontAwesomeIcon
          style={
            item.myState.hasReposted ? styles.ctrlIconReposted : styles.ctrlIcon
          }
          icon="retweet"
          size={18}
        />
        <Text
          style={item.myState.hasReposted ? [s.bold, s.green3, s.f13] : s.f13}>
          {item.repostCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ctrl} onPress={onPressToggleLike}>
        <FontAwesomeIcon
          style={item.myState.hasLiked ? styles.ctrlIconLiked : styles.ctrlIcon}
          icon={[item.myState.hasLiked ? 'fas' : 'far', 'heart']}
          size={14}
        />
        <Text style={item.myState.hasLiked ? [s.bold, s.red3, s.f13] : s.f13}>
          {item.likeCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ctrl}
        onPress={() => onPressShare(item.uri)}>
        <FontAwesomeIcon
          style={styles.ctrlIcon}
          icon="share-from-square"
          size={14}
        />
      </TouchableOpacity>
    </View>
  )

  if (item._isHighlightedPost) {
    return (
      <View style={styles.outer}>
        <View style={styles.layout}>
          <Link style={styles.layoutAvi} href={authorHref} title={authorTitle}>
            <Image
              style={styles.avi}
              source={AVIS[item.author.name] || AVIS['alice.com']}
            />
          </Link>
          <View style={styles.layoutContent}>
            <View style={[styles.meta, s.mt5]}>
              <Link
                style={styles.metaItem}
                href={authorHref}
                title={authorTitle}>
                <Text style={[s.f15, s.bold]}>{item.author.displayName}</Text>
              </Link>
              <Text style={[styles.metaItem, s.f14, s.gray5]}>
                &middot; {ago(item.indexedAt)}
              </Text>
            </View>
            <View style={styles.meta}>
              <Link
                style={styles.metaItem}
                href={authorHref}
                title={authorTitle}>
                <Text style={[s.f14, s.gray5]}>@{item.author.name}</Text>
              </Link>
            </View>
          </View>
        </View>
        <View style={[s.pl10, s.pr10, s.pb10]}>
          <Text style={[styles.postText, s.f18, s['lh18-1.3']]}>
            {record.text}
          </Text>
          {item._isHighlightedPost && hasEngagement ? (
            <View style={styles.expandedInfo}>
              {item.repostCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={repostsHref}
                  title={repostsTitle}>
                  <Text style={[s.gray5, s.semiBold]}>
                    <Text style={[s.bold, s.black]}>{item.repostCount}</Text>{' '}
                    {pluralize(item.repostCount, 'repost')}
                  </Text>
                </Link>
              ) : (
                <></>
              )}
              {item.likeCount ? (
                <Link
                  style={styles.expandedInfoItem}
                  href={likesHref}
                  title={likesTitle}>
                  <Text style={[s.gray5, s.semiBold]}>
                    <Text style={[s.bold, s.black]}>{item.likeCount}</Text>{' '}
                    {pluralize(item.likeCount, 'like')}
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
            <Ctrls />
          </View>
        </View>
      </View>
    )
  } else {
    return (
      <Link style={styles.outer} href={itemHref} title={itemTitle}>
        <View style={styles.layout}>
          <Link style={styles.layoutAvi} href={authorHref} title={authorTitle}>
            <Image
              style={styles.avi}
              source={AVIS[item.author.name] || AVIS['alice.com']}
            />
          </Link>
          <View style={styles.layoutContent}>
            <View style={styles.meta}>
              <Link
                style={styles.metaItem}
                href={authorHref}
                title={authorTitle}>
                <Text style={[s.f15, s.bold]}>{item.author.displayName}</Text>
              </Link>
              <Link
                style={styles.metaItem}
                href={authorHref}
                title={authorTitle}>
                <Text style={[s.f14, s.gray5]}>@{item.author.name}</Text>
              </Link>
              <Text style={[styles.metaItem, s.f14, s.gray5]}>
                &middot; {ago(item.indexedAt)}
              </Text>
            </View>
            <Text style={[styles.postText, s.f15, s['lh15-1.3']]}>
              {record.text}
            </Text>
            <Ctrls />
          </View>
        </View>
      </Link>
    )
  }
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    margin: 2,
    marginBottom: 0,
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
  avi: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
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
  },
  postText: {
    paddingBottom: 5,
    fontFamily: 'Helvetica Neue',
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
  ctrls: {
    flexDirection: 'row',
  },
  ctrl: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 4,
    paddingRight: 4,
  },
  ctrlIcon: {
    marginRight: 5,
    color: colors.gray5,
  },
  ctrlIconReposted: {
    marginRight: 5,
    color: colors.green3,
  },
  ctrlIconLiked: {
    marginRight: 5,
    color: colors.red3,
  },
})
