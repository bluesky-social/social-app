import React from 'react'
import {observer} from 'mobx-react-lite'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {bsky, AdxUri} from '@adxp/mock-api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewPostModel} from '../../../state/models/post-thread-view'
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

  const onPressOuter = () => {
    const urip = new AdxUri(item.uri)
    store.nav.navigate(`/profile/${item.author.name}/post/${urip.recordKey}`)
  }
  const onPressAuthor = () => {
    store.nav.navigate(`/profile/${item.author.name}`)
  }
  const onPressLikes = () => {
    const urip = new AdxUri(item.uri)
    store.nav.navigate(
      `/profile/${item.author.name}/post/${urip.recordKey}/liked-by`,
    )
  }
  const onPressReposts = () => {
    const urip = new AdxUri(item.uri)
    store.nav.navigate(
      `/profile/${item.author.name}/post/${urip.recordKey}/reposted-by`,
    )
  }
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
          <TouchableOpacity style={styles.layoutAvi} onPress={onPressAuthor}>
            <Image
              style={styles.avi}
              source={AVIS[item.author.name] || AVIS['alice.com']}
            />
          </TouchableOpacity>
          <View style={styles.layoutContent}>
            <View style={[styles.meta, s.mt5]}>
              <Text
                style={[styles.metaItem, s.f15, s.bold]}
                onPress={onPressAuthor}>
                {item.author.displayName}
              </Text>
              <Text style={[styles.metaItem, s.f14, s.gray5]}>
                &middot; {ago(item.indexedAt)}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text
                style={[styles.metaItem, s.f14, s.gray5]}
                onPress={onPressAuthor}>
                @{item.author.name}
              </Text>
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
                <Text
                  style={[styles.expandedInfoItem, s.gray5, s.semiBold]}
                  onPress={onPressReposts}>
                  <Text style={[s.bold, s.black]}>{item.repostCount}</Text>{' '}
                  {pluralize(item.repostCount, 'repost')}
                </Text>
              ) : (
                <></>
              )}
              {item.likeCount ? (
                <Text
                  style={[styles.expandedInfoItem, s.gray5, s.semiBold]}
                  onPress={onPressLikes}>
                  <Text style={[s.bold, s.black]}>{item.likeCount}</Text>{' '}
                  {pluralize(item.likeCount, 'like')}
                </Text>
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
      <TouchableOpacity style={styles.outer} onPress={onPressOuter}>
        <View style={styles.layout}>
          <TouchableOpacity style={styles.layoutAvi} onPress={onPressAuthor}>
            <Image
              style={styles.avi}
              source={AVIS[item.author.name] || AVIS['alice.com']}
            />
          </TouchableOpacity>
          <View style={styles.layoutContent}>
            <View style={styles.meta}>
              <Text
                style={[styles.metaItem, s.f15, s.bold]}
                onPress={onPressAuthor}>
                {item.author.displayName}
              </Text>
              <Text
                style={[styles.metaItem, s.f14, s.gray5]}
                onPress={onPressAuthor}>
                @{item.author.name}
              </Text>
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
      </TouchableOpacity>
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
