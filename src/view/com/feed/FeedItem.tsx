import React from 'react'
import {observer} from 'mobx-react-lite'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {bsky, AdxUri} from '@adxp/mock-api'
import moment from 'moment'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {OnNavigateContent} from '../../routes/types'
import {FeedViewItemModel} from '../../../state/models/feed-view'
import {s} from '../../lib/styles'
import {AVIS} from '../../lib/assets'

export const FeedItem = observer(function FeedItem({
  item,
  onNavigateContent,
}: {
  item: FeedViewItemModel
  onNavigateContent: OnNavigateContent
}) {
  const record = item.record as unknown as bsky.Post.Record
  const onPressOuter = () => {
    const urip = new AdxUri(item.uri)
    onNavigateContent('PostThread', {
      name: item.author.name,
      recordKey: urip.recordKey,
    })
  }
  return (
    <TouchableOpacity style={styles.outer} onPress={onPressOuter}>
      {item.repostedBy && (
        <View style={styles.repostedBy}>
          <FontAwesomeIcon icon="retweet" style={styles.repostedByIcon} />
          <Text style={[s.gray, s.bold, s.f13]}>
            Reposted by {item.repostedBy.displayName}
          </Text>
        </View>
      )}
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Image
            style={styles.avi}
            source={AVIS[item.author.name] || AVIS['alice.com']}
          />
        </View>
        <View style={styles.layoutContent}>
          <View style={styles.meta}>
            <Text style={[styles.metaItem, s.f15, s.bold]}>
              {item.author.displayName}
            </Text>
            <Text style={[styles.metaItem, s.f14, s.gray]}>
              @{item.author.name}
            </Text>
            <Text style={[styles.metaItem, s.f14, s.gray]}>
              &middot; {moment(item.indexedAt).fromNow(true)}
            </Text>
          </View>
          <Text style={[styles.postText, s.f15, s['lh15-1.3']]}>
            {record.text}
          </Text>
          <View style={styles.ctrls}>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlIcon}
                icon={['far', 'comment']}
              />
              <Text>{item.replyCount}</Text>
            </View>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlIcon}
                icon="retweet"
                size={22}
              />
              <Text>{item.repostCount}</Text>
            </View>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlIcon}
                icon={['far', 'heart']}
              />
              <Text>{item.likeCount}</Text>
            </View>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlIcon}
                icon="share-from-square"
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    backgroundColor: '#fff',
    padding: 10,
  },
  repostedBy: {
    flexDirection: 'row',
    paddingLeft: 70,
  },
  repostedByIcon: {
    marginRight: 2,
    color: 'gray',
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 70,
  },
  avi: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    paddingTop: 2,
    paddingBottom: 4,
  },
  metaItem: {
    paddingRight: 5,
  },
  postText: {
    paddingBottom: 5,
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
    color: 'gray',
  },
})
