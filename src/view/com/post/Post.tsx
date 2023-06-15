import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  ActivityIndicator,
  Linking,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyFeedPost as FeedPost} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  PostThreadModel,
  PostThreadItemModel,
} from 'state/models/content/post-thread'
import {Link} from '../util/Link'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/post-embeds'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostHider} from '../util/moderation/PostHider'
import {ContentHider} from '../util/moderation/ContentHider'
import {ImageHider} from '../util/moderation/ImageHider'
import {Text} from '../util/text/Text'
import {RichText} from '../util/text/RichText'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'

export const Post = observer(function Post({
  uri,
  initView,
  showReplyLine,
  hideError,
  style,
}: {
  uri: string
  initView?: PostThreadModel
  showReplyLine?: boolean
  hideError?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [view, setView] = useState<PostThreadModel | undefined>(initView)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    if (initView || view?.params.uri === uri) {
      return // no change needed? or trigger refresh?
    }
    const newView = new PostThreadModel(store, {uri, depth: 0})
    setView(newView)
    newView.setup().catch(err => store.log.error('Failed to fetch post', err))
  }, [initView, uri, view?.params.uri, store])

  // deleted
  // =
  if (deleted) {
    return <View />
  }

  // loading
  // =
  if (
    !view ||
    (!view.hasContent && view.isLoading) ||
    view.params.uri !== uri
  ) {
    return (
      <View style={pal.view}>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  // =
  if (view.hasError || !view.thread || !view.thread?.postRecord) {
    if (hideError) {
      return <View />
    }
    return (
      <View style={pal.view}>
        <Text>{view.error || 'Thread not found'}</Text>
      </View>
    )
  }

  // loaded
  // =

  return (
    <PostLoaded
      item={view.thread}
      record={view.thread.postRecord}
      setDeleted={setDeleted}
      showReplyLine={showReplyLine}
      style={style}
    />
  )
})

const PostLoaded = observer(
  ({
    item,
    record,
    setDeleted,
    showReplyLine,
    style,
  }: {
    item: PostThreadItemModel
    record: FeedPost.Record
    setDeleted: (v: boolean) => void
    showReplyLine?: boolean
    style?: StyleProp<ViewStyle>
  }) => {
    const pal = usePalette('default')
    const store = useStores()

    const itemUri = item.post.uri
    const itemCid = item.post.cid
    const itemUrip = new AtUri(item.post.uri)
    const itemHref = `/profile/${item.post.author.handle}/post/${itemUrip.rkey}`
    const itemTitle = `Post by ${item.post.author.handle}`
    const authorHref = `/profile/${item.post.author.handle}`
    const authorTitle = item.post.author.handle
    let replyAuthorDid = ''
    if (record.reply) {
      const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
      replyAuthorDid = urip.hostname
    }
    const onPressReply = React.useCallback(() => {
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
    }, [store, item, record])

    const onPressToggleRepost = React.useCallback(() => {
      return item
        .toggleRepost()
        .catch(e => store.log.error('Failed to toggle repost', e))
    }, [item, store])

    const onPressToggleLike = React.useCallback(() => {
      return item
        .toggleLike()
        .catch(e => store.log.error('Failed to toggle like', e))
    }, [item, store])

    const onCopyPostText = React.useCallback(() => {
      Clipboard.setString(record.text)
      Toast.show('Copied to clipboard')
    }, [record])

    const primaryLanguage = store.preferences.contentLanguages[0] || 'en'

    const onOpenTranslate = React.useCallback(() => {
      Linking.openURL(
        encodeURI(
          `https://translate.google.com/?sl=auto&tl=${primaryLanguage}&text=${
            record?.text || ''
          }`,
        ),
      )
    }, [record, primaryLanguage])

    const onToggleThreadMute = React.useCallback(async () => {
      try {
        await item.toggleThreadMute()
        if (item.isThreadMuted) {
          Toast.show(
            'You will no longer received notifications for this thread',
          )
        } else {
          Toast.show('You will now receive notifications for this thread')
        }
      } catch (e) {
        store.log.error('Failed to toggle thread mute', e)
      }
    }, [item, store])

    const onDeletePost = React.useCallback(() => {
      item.delete().then(
        () => {
          setDeleted(true)
          Toast.show('Post deleted')
        },
        e => {
          store.log.error('Failed to delete post', e)
          Toast.show('Failed to delete post, please try again')
        },
      )
    }, [item, setDeleted, store])

    const accessibilityActions = useMemo(
      () => [
        {
          name: 'reply',
          label: 'Reply',
        },
        {
          name: 'repost',
          label: item.post.viewer?.repost ? 'Undo repost' : 'Repost',
        },
        {name: 'like', label: item.post.viewer?.like ? 'Unlike' : 'Like'},
      ],
      [item.post.viewer?.like, item.post.viewer?.repost],
    )

    const onAccessibilityAction = useCallback(
      event => {
        switch (event.nativeEvent.actionName) {
          case 'like':
            onPressToggleLike()
            break
          case 'reply':
            onPressReply()
            break
          case 'repost':
            onPressToggleRepost()
            break
          default:
            break
        }
      },
      [onPressReply, onPressToggleLike, onPressToggleRepost],
    )

    return (
      <PostHider
        href={itemHref}
        style={[styles.outer, pal.view, pal.border, style]}
        moderation={item.moderation.list}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={onAccessibilityAction}>
        {showReplyLine && <View style={styles.replyLine} />}
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <Link href={authorHref} title={authorTitle} asAnchor>
              <UserAvatar
                size={52}
                avatar={item.post.author.avatar}
                moderation={item.moderation.avatar}
              />
            </Link>
          </View>
          <View style={styles.layoutContent}>
            <PostMeta
              authorHandle={item.post.author.handle}
              authorDisplayName={item.post.author.displayName}
              authorHasWarning={!!item.post.author.labels?.length}
              timestamp={item.post.indexedAt}
              postHref={itemHref}
              did={item.post.author.did}
            />
            {replyAuthorDid !== '' && (
              <View style={[s.flexRow, s.mb2, s.alignCenter]}>
                <FontAwesomeIcon
                  icon="reply"
                  size={9}
                  style={[pal.textLight, s.mr5]}
                />
                <Text
                  type="sm"
                  style={[pal.textLight, s.mr2]}
                  lineHeight={1.2}
                  numberOfLines={1}>
                  Reply to{' '}
                  <UserInfoText
                    type="sm"
                    did={replyAuthorDid}
                    attr="displayName"
                    style={[pal.textLight]}
                  />
                </Text>
              </View>
            )}
            <ContentHider
              moderation={item.moderation.list}
              containerStyle={styles.contentHider}>
              {item.richText?.text ? (
                <View style={styles.postTextContainer}>
                  <RichText
                    testID="postText"
                    type="post-text"
                    richText={item.richText}
                    lineHeight={1.3}
                  />
                </View>
              ) : undefined}
              <ImageHider moderation={item.moderation.list} style={s.mb10}>
                <PostEmbeds embed={item.post.embed} style={s.mb10} />
              </ImageHider>
            </ContentHider>
            <PostCtrls
              itemUri={itemUri}
              itemCid={itemCid}
              itemHref={itemHref}
              itemTitle={itemTitle}
              author={{
                avatar: item.post.author.avatar!,
                handle: item.post.author.handle,
                displayName: item.post.author.displayName!,
              }}
              indexedAt={item.post.indexedAt}
              text={item.richText?.text || record.text}
              isAuthor={item.post.author.did === store.me.did}
              replyCount={item.post.replyCount}
              repostCount={item.post.repostCount}
              likeCount={item.post.likeCount}
              isReposted={!!item.post.viewer?.repost}
              isLiked={!!item.post.viewer?.like}
              isThreadMuted={item.isThreadMuted}
              onPressReply={onPressReply}
              onPressToggleRepost={onPressToggleRepost}
              onPressToggleLike={onPressToggleLike}
              onCopyPostText={onCopyPostText}
              onOpenTranslate={onOpenTranslate}
              onToggleThreadMute={onToggleThreadMute}
              onDeletePost={onDeletePost}
            />
          </View>
        </View>
      </PostHider>
    )
  },
)

const styles = StyleSheet.create({
  outer: {
    padding: 10,
    paddingRight: 15,
    borderTopWidth: 1,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 70,
    paddingLeft: 8,
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
  replyLine: {
    position: 'absolute',
    left: 36,
    top: 70,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray2,
  },
  contentHider: {
    marginTop: 4,
  },
})
