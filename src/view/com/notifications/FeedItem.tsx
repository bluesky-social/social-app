import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {Image, StyleSheet, Text, View} from 'react-native'
import {AdxUri} from '../../../third-party/uri'
import {FontAwesomeIcon, Props} from '@fortawesome/react-native-fontawesome'
import {NotificationsViewItemModel} from '../../../state/models/notifications-view'
import {s, colors} from '../../lib/styles'
import {ago} from '../../lib/strings'
import {AVIS} from '../../lib/assets'
import {PostText} from '../post/PostText'
import {Post} from '../post/Post'
import {Link} from '../util/Link'

export const FeedItem = observer(function FeedItem({
  item,
}: {
  item: NotificationsViewItemModel
}) {
  const itemHref = useMemo(() => {
    if (item.isLike || item.isRepost) {
      const urip = new AdxUri(item.subjectUri)
      return `/profile/${urip.host}/post/${urip.recordKey}`
    } else if (item.isFollow) {
      return `/profile/${item.author.name}`
    } else if (item.isReply) {
      const urip = new AdxUri(item.uri)
      return `/profile/${urip.host}/post/${urip.recordKey}`
    }
    return ''
  }, [item])
  const itemTitle = useMemo(() => {
    if (item.isLike || item.isRepost) {
      return 'Post'
    } else if (item.isFollow) {
      return item.author.name
    } else if (item.isReply) {
      return 'Post'
    }
  }, [item])
  const authorHref = `/profile/${item.author.name}`
  const authorTitle = item.author.name

  let action = ''
  let icon: Props['icon']
  if (item.isLike) {
    action = 'liked your post'
    icon = ['far', 'heart']
  } else if (item.isRepost) {
    action = 'reposted your post'
    icon = 'retweet'
  } else if (item.isReply) {
    action = 'replied to your post'
    icon = ['far', 'comment']
  } else if (item.isFollow) {
    action = 'followed you'
    icon = 'plus'
  } else {
    return <></>
  }

  return (
    <Link style={styles.outer} href={itemHref} title={itemTitle}>
      <View style={styles.layout}>
        <Link style={styles.layoutAvi} href={authorHref} title={authorTitle}>
          <Image
            style={styles.avi}
            source={AVIS[item.author.name] || AVIS['alice.test']}
          />
        </Link>
        <View style={styles.layoutContent}>
          <View style={styles.meta}>
            <FontAwesomeIcon icon={icon} size={14} style={[s.mt2, s.mr5]} />
            <Link style={styles.metaItem} href={authorHref} title={authorTitle}>
              <Text style={[s.f14, s.bold]}>{item.author.displayName}</Text>
            </Link>
            <Text style={[styles.metaItem, s.f14]}>{action}</Text>
            <Text style={[styles.metaItem, s.f14, s.gray5]}>
              {ago(item.indexedAt)}
            </Text>
          </View>
          {item.isLike || item.isRepost ? (
            <PostText uri={item.subjectUri} style={[s.gray5]} />
          ) : (
            <></>
          )}
        </View>
      </View>
      {item.isReply ? (
        <View style={s.pt5}>
          <Post uri={item.uri} />
        </View>
      ) : (
        <></>
      )}
    </Link>
  )
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
    padding: 10,
    paddingBottom: 0,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 40,
  },
  avi: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 3,
  },
  postText: {
    paddingBottom: 5,
  },
})
