import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {AtUri} from '../../../third-party/uri'
import * as PostType from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {PostThreadViewModel} from '../../../state/models/post-thread-view'
import {Link} from '../util/Link'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/PostCtrls'
import {RichText} from '../util/RichText'
import Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const Post = observer(function Post({uri}: {uri: string}) {
  const store = useStores()
  const [view, setView] = useState<PostThreadViewModel | undefined>()
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    if (view?.params.uri === uri) {
      return // no change needed? or trigger refresh?
    }
    const newView = new PostThreadViewModel(store, {uri, depth: 0})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch post', err))
  }, [uri, view?.params.uri, store])

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
  const record = view.thread?.record as unknown as PostType.Record

  const itemUrip = new AtUri(item.uri)
  const itemHref = `/profile/${item.author.handle}/post/${itemUrip.rkey}`
  const itemTitle = `Post by ${item.author.handle}`
  const authorHref = `/profile/${item.author.handle}`
  const authorTitle = item.author.handle
  let replyAuthorDid = ''
  let replyHref = ''
  if (record.reply) {
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    replyAuthorDid = urip.hostname
    replyHref = `/profile/${urip.hostname}/post/${urip.rkey}`
  }
  const onPressReply = () => {
    store.shell.openComposer({replyTo: {uri: item.uri, cid: item.cid}})
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
  const onPressToggleDownvote = () => {
    item
      .toggleDownvote()
      .catch(e => console.error('Failed to toggle downvote', record, e))
  }
  const onDeletePost = () => {
    item.delete().then(
      () => {
        setDeleted(true)
        Toast.show('Post deleted', {
          position: Toast.positions.TOP,
        })
      },
      e => {
        console.error(e)
        Toast.show('Failed to delete post, please try again', {
          position: Toast.positions.TOP,
        })
      },
    )
  }

  return (
    <Link style={styles.outer} href={itemHref} title={itemTitle}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Link href={authorHref} title={authorTitle}>
            <UserAvatar
              size={50}
              displayName={item.author.displayName}
              handle={item.author.handle}
            />
          </Link>
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            itemHref={itemHref}
            itemTitle={itemTitle}
            authorHref={authorHref}
            authorHandle={item.author.handle}
            authorDisplayName={item.author.displayName}
            timestamp={item.indexedAt}
            isAuthor={item.author.did === store.me.did}
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
          <View style={styles.postTextContainer}>
            <RichText
              text={record.text}
              entities={record.entities}
              style={[s.f16, s['lh16-1.3']]}
            />
          </View>
          <PostCtrls
            replyCount={item.replyCount}
            repostCount={item.repostCount}
            upvoteCount={item.upvoteCount}
            downvoteCount={item.downvoteCount}
            isReposted={!!item.myState.repost}
            isUpvoted={!!item.myState.upvote}
            isDownvoted={!!item.myState.downvote}
            onPressReply={onPressReply}
            onPressToggleRepost={onPressToggleRepost}
            onPressToggleUpvote={onPressToggleUpvote}
            onPressToggleDownvote={onPressToggleDownvote}
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
})
