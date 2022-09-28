import React, {useState, useEffect, useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {AdxUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/types/todo/social/post'
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewModel} from '../../../state/models/post-thread-view'
import {ComposePostModel} from '../../../state/models/shell'
import {Link} from '../util/Link'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'
import {ago} from '../../lib/strings'
import {DEF_AVATER} from '../../lib/assets'

export const Post = observer(function Post({uri}: {uri: string}) {
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
  const record = view.thread?.record as unknown as PostType.Record

  const itemHref = useMemo(() => {
    const urip = new AdxUri(item.uri)
    return `/profile/${item.author.name}/post/${urip.recordKey}`
  }, [item.uri, item.author.name])
  const itemTitle = `Post by ${item.author.name}`
  const authorHref = `/profile/${item.author.name}`
  const authorTitle = item.author.name
  const onPressReply = () => {
    store.shell.openModal(new ComposePostModel(item.uri))
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
    <Link style={styles.outer} href={itemHref} title={itemTitle}>
      <View style={styles.layout}>
        <Link style={styles.layoutAvi} href={authorHref} title={authorTitle}>
          <Image style={styles.avi} source={DEF_AVATER} />
        </Link>
        <View style={styles.layoutContent}>
          <View style={styles.meta}>
            <Link style={styles.metaItem} href={authorHref} title={authorTitle}>
              <Text style={[s.f15, s.bold]}>{item.author.displayName}</Text>
            </Link>
            <Link style={styles.metaItem} href={authorHref} title={authorTitle}>
              <Text style={[s.f14, s.gray5]}>@{item.author.name}</Text>
            </Link>
            <Text style={[styles.metaItem, s.f14, s.gray5]}>
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
                  item.myState.repost
                    ? styles.ctrlIconReposted
                    : styles.ctrlIcon
                }
                icon="retweet"
                size={22}
              />
              <Text
                style={item.myState.repost ? [s.bold, s.green3] : undefined}>
                {item.repostCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrl} onPress={onPressToggleLike}>
              <FontAwesomeIcon
                style={
                  item.myState.like ? styles.ctrlIconLiked : styles.ctrlIcon
                }
                icon={[item.myState.like ? 'fas' : 'far', 'heart']}
              />
              <Text style={item.myState.like ? [s.bold, s.red3] : undefined}>
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
    </Link>
  )
})

const styles = StyleSheet.create({
  outer: {
    marginTop: 1,
    borderRadius: 6,
    backgroundColor: colors.white,
    padding: 10,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 60,
  },
  avi: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
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
  postText: {
    paddingBottom: 8,
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
