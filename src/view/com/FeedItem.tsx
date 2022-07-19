import React from 'react'
import {observer} from 'mobx-react-lite'
import {Text, Image, ImageSourcePropType, StyleSheet, View} from 'react-native'
import {bsky} from '@adxp/mock-api'
import moment from 'moment'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
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
        <View style={styles.repostedBy}>
          <FontAwesomeIcon icon="retweet" style={styles.repostedByIcon} />
          <Text style={styles.repostedByText}>
            Reposted by {item.repostedBy.displayName}
          </Text>
        </View>
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
          <View style={styles.ctrls}>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlReplyIcon}
                icon={['far', 'comment']}
              />
              <Text>{item.replyCount}</Text>
            </View>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlRepostIcon}
                icon="retweet"
                size={22}
              />
              <Text>{item.repostCount}</Text>
            </View>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlLikeIcon}
                icon={['far', 'heart']}
              />
              <Text>{item.likeCount}</Text>
            </View>
            <View style={styles.ctrl}>
              <FontAwesomeIcon
                style={styles.ctrlShareIcon}
                icon="share-from-square"
              />
            </View>
          </View>
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
    flexDirection: 'row',
    paddingLeft: 70,
  },
  repostedByIcon: {
    marginRight: 2,
    color: 'gray',
  },
  repostedByText: {
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
  ctrlReplyIcon: {
    marginRight: 5,
    color: 'gray',
  },
  ctrlRepostIcon: {
    marginRight: 5,
    color: 'gray',
  },
  ctrlLikeIcon: {
    marginRight: 5,
    color: 'gray',
  },
  ctrlShareIcon: {
    marginRight: 5,
    color: 'gray',
  },
})
