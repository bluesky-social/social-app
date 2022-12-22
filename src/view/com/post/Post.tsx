import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '../../../third-party/uri'
import {AppBskyFeedPost} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewModel} from '../../../state/models/post-thread-view'
import {Link} from '../util/Link'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/PostEmbeds'
import {PostCtrls} from '../util/PostCtrls'
import {Text} from '../util/Text'
import {RichText} from '../util/RichText'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const Post = observer(function Post({
  uri,
  initView,
  showReplyLine,
  style,
}: {
  uri: string
  initView?: PostThreadViewModel
  showReplyLine?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const store = useStores()
  const [view, setView] = useState<PostThreadViewModel | undefined>(initView)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    if (initView || view?.params.uri === uri) {
      return // no change needed? or trigger refresh?
    }
    const newView = new PostThreadViewModel(store, {uri, depth: 0})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch post', err))
  }, [initView, uri, view?.params.uri, store])

  // deleted
  // =
  if (deleted) {
    return <View />
  }

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
  const record = view.thread?.post.record as unknown as AppBskyFeedPost.Record

  const itemUrip = new AtUri(item.post.uri)
  const itemHref = `/profile/${item.post.author.handle}/post/${itemUrip.rkey}`
  const itemTitle = `Post by ${item.post.author.handle}`
  const authorHref = `/profile/${item.post.author.handle}`
  const authorTitle = item.post.author.handle
  let replyAuthorDid = ''
  let replyHref = ''
  if (record.reply) {
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    replyAuthorDid = urip.hostname
    replyHref = `/profile/${urip.hostname}/post/${urip.rkey}`
  }
  const onPressReply = () => {
    store.shell.openComposer({
      replyTo: {
        uri: item.post.uri,
        cid: item.post.cid,
        text: record.text as string,
        author: {
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
      },
    })
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
  const onCopyPostText = () => {
    Clipboard.setString(record.text)
    Toast.show('Copied to clipboard')
  }
  const onDeletePost = () => {
    item.delete().then(
      () => {
        setDeleted(true)
        Toast.show('Post deleted')
      },
      e => {
        console.error(e)
        Toast.show('Failed to delete post, please try again')
      },
    )
  }

  return (
    <Link
      style={[styles.outer, style]}
      href={itemHref}
      title={itemTitle}
      noFeedback>
      {showReplyLine && <View style={styles.replyLine} />}
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Link href={authorHref} title={authorTitle}>
            <UserAvatar
              size={52}
              displayName={item.post.author.displayName}
              handle={item.post.author.handle}
              avatar={item.post.author.avatar}
            />
          </Link>
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            itemHref={itemHref}
            itemTitle={itemTitle}
            authorHref={authorHref}
            authorHandle={item.post.author.handle}
            authorDisplayName={item.post.author.displayName}
            timestamp={item.post.indexedAt}
            isAuthor={item.post.author.did === store.me.did}
            onCopyPostText={onCopyPostText}
            onDeletePost={onDeletePost}
          />
          {replyHref !== '' && (
            <View style={[s.flexRow, s.mb2, {alignItems: 'center'}]}>
              <FontAwesomeIcon icon="reply" size={9} style={[s.gray4, s.mr5]} />
              <Text style={[s.gray4, s.f12, s.mr2]}>Reply to</Text>
              <Link href={replyHref} title="Parent post">
                <UserInfoText
                  did={replyAuthorDid}
                  style={[s.f12, s.gray5]}
                  prefix="@"
                />
              </Link>
            </View>
          )}
          {record.text ? (
            <View style={styles.postTextContainer}>
              <RichText
                text={record.text}
                entities={record.entities}
                style={styles.postText}
              />
            </View>
          ) : (
            <View style={{height: 5}} />
          )}
          <PostEmbeds embed={item.post.embed} style={{marginBottom: 10}} />
          <PostCtrls
            replyCount={item.post.replyCount}
            repostCount={item.post.repostCount}
            upvoteCount={item.post.upvoteCount}
            isReposted={!!item.post.viewer.repost}
            isUpvoted={!!item.post.viewer.upvote}
            onPressReply={onPressReply}
            onPressToggleRepost={onPressToggleRepost}
            onPressToggleUpvote={onPressToggleUpvote}
          />
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
  layoutContent: {
    flex: 1,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  postText: {
    fontFamily: 'System',
    fontSize: 16,
    lineHeight: 20.8, // 1.3 of 16px
    color: colors.black,
  },
  replyLine: {
    position: 'absolute',
    left: 36,
    top: 70,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
})
