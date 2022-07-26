import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {bsky, AdxUri} from '@adxp/mock-api'
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {OnNavigateContent} from '../../routes/types'
import {PostThreadViewModel} from '../../../state/models/post-thread-view'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'
import {ago} from '../../lib/strings'
import {AVIS} from '../../lib/assets'

export const Post = observer(function Post({
  uri,
  onNavigateContent,
}: {
  uri: string
  onNavigateContent: OnNavigateContent
}) {
  const store = useStores()
  const [view, setView] = useState<PostThreadViewModel | undefined>()

  useEffect(() => {
    if (view?.params.uri === uri) {
      return // no change needed? or trigger refresh?
    }
    const newView = new PostThreadViewModel(store, {uri, depth: 0})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch post', err))
  }, [uri, view?.params.uri, store])

  // loading
  // =
  if (!view || view.isLoading || view.params.uri !== uri) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  // =
  if (view.hasError || !view.thread) {
    return (
      <View>
        <Text>{view.error || 'Thread not found'}</Text>
      </View>
    )
  }

  // loaded
  // =
  const item = view.thread
  const record = view.thread?.record as unknown as bsky.Post.Record

  const onPressOuter = () => {
    const urip = new AdxUri(item.uri)
    onNavigateContent('PostThread', {
      name: item.author.name,
      recordKey: urip.recordKey,
    })
  }
  const onPressAuthor = () => {
    onNavigateContent('Profile', {
      name: item.author.name,
    })
  }
  const onPressReply = () => {
    onNavigateContent('Composer', {
      replyTo: item.uri,
    })
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
              style={[styles.metaItem, s.f14, s.gray]}
              onPress={onPressAuthor}>
              @{item.author.name}
            </Text>
            <Text style={[styles.metaItem, s.f14, s.gray]}>
              &middot; {ago(item.indexedAt)}
            </Text>
          </View>
          <Text style={[styles.postText, s.f15, s['lh15-1.3']]}>
            {record.text}
          </Text>
          <View style={styles.ctrls}>
            <TouchableOpacity style={styles.ctrl} onPress={onPressReply}>
              <FontAwesomeIcon
                style={styles.ctrlIcon}
                icon={['far', 'comment']}
              />
              <Text>{item.replyCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrl} onPress={onPressToggleRepost}>
              <FontAwesomeIcon
                style={
                  item.myState.hasReposted
                    ? styles.ctrlIconReposted
                    : styles.ctrlIcon
                }
                icon="retweet"
                size={22}
              />
              <Text
                style={
                  item.myState.hasReposted ? [s.bold, s.green] : undefined
                }>
                {item.repostCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrl} onPress={onPressToggleLike}>
              <FontAwesomeIcon
                style={
                  item.myState.hasLiked ? styles.ctrlIconLiked : styles.ctrlIcon
                }
                icon={[item.myState.hasLiked ? 'fas' : 'far', 'heart']}
              />
              <Text style={item.myState.hasLiked ? [s.bold, s.red] : undefined}>
                {item.likeCount}
              </Text>
            </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 4,
    backgroundColor: '#fff',
    padding: 10,
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
  ctrlIconReposted: {
    marginRight: 5,
    color: 'green',
  },
  ctrlIconLiked: {
    marginRight: 5,
    color: 'red',
  },
})
