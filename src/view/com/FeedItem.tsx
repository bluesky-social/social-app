import React from 'react'
import {observer} from 'mobx-react-lite'
import {Text, Image, ImageSourcePropType, StyleSheet, View} from 'react-native'
import {bsky} from '@adxp/mock-api'
import moment from 'moment'
import {FeedViewItemModel} from '../../state/models/feed-view'

const IMAGES: Record<string, ImageSourcePropType> = {
  'alice.com': require('../../assets/alice.jpg'),
  'bob.com': require('../../assets/bob.jpg'),
  'carla.com': require('../../assets/carla.jpg'),
}

export const FeedItem = observer(function FeedItem({
  item,
}: {
  item: FeedViewItemModel
}) {
  const record = item.record as unknown as bsky.Post.Record
  return (
    <View style={styles.outer}>
      {item.repostedBy && (
        <Text style={styles.repostedBy}>
          Reposted by {item.repostedBy.displayName}
        </Text>
      )}
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Image
            style={styles.avi}
            source={IMAGES[item.author.name] || IMAGES['alice.com']}
          />
        </View>
        <View style={styles.layoutContent}>
          <View style={styles.meta}>
            <Text style={[styles.metaItem, styles.metaDisplayName]}>
              {item.author.displayName}
            </Text>
            <Text style={[styles.metaItem, styles.metaName]}>
              @{item.author.name}
            </Text>
            <Text style={[styles.metaItem, styles.metaDate]}>
              &middot; {moment(item.indexedAt).fromNow(true)}
            </Text>
          </View>
          <Text style={styles.postText}>{record.text}</Text>
        </View>
      </View>
    </View>
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
    paddingLeft: 70,
    color: 'gray',
    fontWeight: 'bold',
    fontSize: 13,
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
  metaDisplayName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  metaName: {
    fontSize: 14,
    color: 'gray',
  },
  metaDate: {
    fontSize: 14,
    color: 'gray',
  },
  postText: {
    fontSize: 15,
  },
})
