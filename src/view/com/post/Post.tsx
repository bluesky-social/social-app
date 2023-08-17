import React, {useEffect, useState, useMemo} from 'react'
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
import {PostThreadModel} from 'state/models/content/post-thread'
import {PostThreadItemModel} from 'state/models/content/post-thread-item'
import {Link} from '../util/Link'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/post-embeds'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {ContentHider} from '../util/moderation/ContentHider'
import {PostAlerts} from '../util/moderation/PostAlerts'
import {Text} from '../util/text/Text'
import {RichText} from '../util/text/RichText'
import * as Toast from '../util/Toast'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {getTranslatorLink, isPostInLanguage} from '../../../locale/helpers'
import {makeProfileLink} from 'lib/routes/links'

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
    const itemHref = makeProfileLink(item.post.author, 'post', itemUrip.rkey)
    const itemTitle = `Post by ${item.post.author.handle}`
    let replyAuthorDid = ''
    if (record.reply) {
      const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
      replyAuthorDid = urip.hostname
    }

    const translatorUrl = getTranslatorLink(record?.text || '')
    const needsTranslation = useMemo(
      () =>
        store.preferences.contentLanguages.length > 0 &&
        !isPostInLanguage(item.post, store.preferences.contentLanguages),
      [item.post, store.preferences.contentLanguages],
    )

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

    const onOpenTranslate = React.useCallback(() => {
      Linking.openURL(translatorUrl)
    }, [translatorUrl])

    const onToggleThreadMute = React.useCallback(async () => {
      try {
        await item.toggleThreadMute()
        if (item.isThreadMuted) {
          Toast.show('You will no longer receive notifications for this thread')
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

    return (
      <Link href={itemHref} style={[styles.outer, pal.view, pal.border, style]}>
        {showReplyLine && <View style={styles.replyLine} />}
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <PreviewableUserAvatar
              size={52}
              did={item.post.author.did}
              handle={item.post.author.handle}
              avatar={item.post.author.avatar}
              moderation={item.moderation.avatar}
            />
          </View>
          <View style={styles.layoutContent}>
            <PostMeta
              author={item.post.author}
              authorHasWarning={!!item.post.author.labels?.length}
              timestamp={item.post.indexedAt}
              postHref={itemHref}
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
              moderation={item.moderation.content}
              style={styles.contentHider}
              childContainerStyle={styles.contentHiderChild}>
              <PostAlerts
                moderation={item.moderation.content}
                style={styles.alert}
              />
              {item.richText?.text ? (
                <View style={styles.postTextContainer}>
                  <RichText
                    testID="postText"
                    type="post-text"
                    richText={item.richText}
                    lineHeight={1.3}
                    style={s.flex1}
                  />
                </View>
              ) : undefined}
              {item.post.embed ? (
                <ContentHider
                  moderation={item.moderation.embed}
                  style={styles.contentHider}>
                  <PostEmbeds
                    embed={item.post.embed}
                    moderation={item.moderation.embed}
                  />
                </ContentHider>
              ) : null}
              {needsTranslation && (
                <View style={[pal.borderDark, styles.translateLink]}>
                  <Link href={translatorUrl} title="Translate">
                    <Text type="sm" style={pal.link}>
                      Translate this post
                    </Text>
                  </Link>
                </View>
              )}
            </ContentHider>
            <PostCtrls
              itemUri={itemUri}
              itemCid={itemCid}
              itemHref={itemHref}
              itemTitle={itemTitle}
              author={item.post.author}
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
      </Link>
    )
  },
)

const styles = StyleSheet.create({
  outer: {
    paddingTop: 10,
    paddingRight: 15,
    paddingBottom: 5,
    paddingLeft: 10,
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
  alert: {
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  translateLink: {
    marginBottom: 12,
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
    marginBottom: 2,
  },
  contentHiderChild: {
    marginTop: 6,
  },
})
