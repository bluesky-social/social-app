import React from 'react'
import {observer} from 'mobx-react-lite'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {AdxUri} from '@adxp/mock-api'
import {FontAwesomeIcon, Props} from '@fortawesome/react-native-fontawesome'
import {OnNavigateContent} from '../../routes/types'
import {NotificationsViewItemModel} from '../../../state/models/notifications-view'
import {s} from '../../lib/styles'
import {ago} from '../../lib/strings'
import {AVIS} from '../../lib/assets'
import {PostText} from '../post/PostText'
import {Post} from '../post/Post'

export const FeedItem = observer(function FeedItem({
  item,
  onNavigateContent,
}: {
  item: NotificationsViewItemModel
  onNavigateContent: OnNavigateContent
}) {
  const onPressOuter = () => {
    if (item.isLike || item.isRepost) {
      const urip = new AdxUri(item.subjectUri)
      onNavigateContent('PostThread', {
        name: urip.host,
        recordKey: urip.recordKey,
      })
    } else if (item.isFollow) {
      onNavigateContent('Profile', {
        name: item.author.name,
      })
    } else if (item.isReply) {
      const urip = new AdxUri(item.uri)
      onNavigateContent('PostThread', {
        name: urip.host,
        recordKey: urip.recordKey,
      })
    }
  }
  const onPressAuthor = () => {
    onNavigateContent('Profile', {
      name: item.author.name,
    })
  }

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
            <FontAwesomeIcon icon={icon} size={14} style={[s.mt2, s.mr5]} />
            <Text
              style={[styles.metaItem, s.f14, s.bold]}
              onPress={onPressAuthor}>
              {item.author.displayName}
            </Text>
            <Text style={[styles.metaItem, s.f14]}>{action}</Text>
            <Text style={[styles.metaItem, s.f14, s.gray]}>
              {ago(item.indexedAt)}
            </Text>
          </View>
          {item.isLike || item.isRepost ? (
            <PostText uri={item.subjectUri} style={[s.gray]} />
          ) : (
            <></>
          )}
        </View>
      </View>
      {item.isReply ? (
        <View style={s.pt5}>
          <Post uri={item.uri} onNavigateContent={onNavigateContent} />
        </View>
      ) : (
        <></>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#fff',
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
    paddingBottom: 4,
  },
  metaItem: {
    paddingRight: 3,
  },
  postText: {
    paddingBottom: 5,
  },
})
