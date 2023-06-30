import React, {useCallback, useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {AccessibilityActionEvent, Linking, StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {ModerationBehaviorCode} from 'lib/labeling/types'
import {Link, DesktopWebTextLink} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {PostHider} from '../util/moderation/PostHider'
import {ContentHider} from '../util/moderation/ContentHider'
import {ImageHider} from '../util/moderation/ImageHider'
import {RichText} from '../util/text/RichText'
import {PostSandboxWarning} from '../util/PostSandboxWarning'
import * as Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {getTranslatorLink, isPostInLanguage} from '../../../locale/helpers'

export const FeedItem = observer(function ({
  item,
  isThreadChild,
  isThreadParent,
  showFollowBtn,
  ignoreMuteFor,
}: {
  item: PostsFeedItemModel
  isThreadChild?: boolean
  isThreadParent?: boolean
  showReplyLine?: boolean
  showFollowBtn?: boolean
  ignoreMuteFor?: string
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const [deleted, setDeleted] = useState(false)
  const record = item.postRecord
  const itemUri = item.post.uri
  const itemCid = item.post.cid
  const itemHref = useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return `/profile/${item.post.author.handle}/post/${urip.rkey}`
  }, [item.post.uri, item.post.author.handle])
  const itemTitle = `Post by ${item.post.author.handle}`
  const authorHref = `/profile/${item.post.author.handle}`
  const replyAuthorDid = useMemo(() => {
    if (!record?.reply) {
      return ''
    }
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    return urip.hostname
  }, [record?.reply])
  const primaryLanguage = store.preferences.contentLanguages[0] || 'en'
  const translatorUrl = getTranslatorLink(primaryLanguage, record?.text || '')
  const needsTranslation = useMemo(
    () =>
      store.preferences.contentLanguages.length > 0 &&
      !isPostInLanguage(item.post, store.preferences.contentLanguages),
    [item.post, store.preferences.contentLanguages],
  )

  const onPressReply = React.useCallback(() => {
    track('FeedItem:PostReply')
    store.shell.openComposer({
      replyTo: {
        uri: item.post.uri,
        cid: item.post.cid,
        text: record?.text || '',
        author: {
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
      },
    })
  }, [item, track, record, store])

  const onPressToggleRepost = React.useCallback(() => {
    track('FeedItem:PostRepost')
    return item
      .toggleRepost()
      .catch(e => store.log.error('Failed to toggle repost', e))
  }, [track, item, store])

  const onPressToggleLike = React.useCallback(() => {
    track('FeedItem:PostLike')
    return item
      .toggleLike()
      .catch(e => store.log.error('Failed to toggle like', e))
  }, [track, item, store])

  const onCopyPostText = React.useCallback(() => {
    Clipboard.setString(record?.text || '')
    Toast.show('Copied to clipboard')
  }, [record])

  const onOpenTranslate = React.useCallback(() => {
    Linking.openURL(translatorUrl)
  }, [translatorUrl])

  const onToggleThreadMute = React.useCallback(async () => {
    track('FeedItem:ThreadMute')
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
  }, [track, item, store])

  const onDeletePost = React.useCallback(() => {
    track('FeedItem:PostDelete')
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
  }, [track, item, setDeleted, store])

  const isSmallTop = isThreadChild
  const outerStyles = [
    styles.outer,
    pal.view,
    {borderColor: pal.colors.border},
    isSmallTop ? styles.outerSmallTop : undefined,
    isThreadParent ? styles.outerNoBottom : undefined,
  ]

  // moderation override
  let moderation = item.moderation.list
  if (
    ignoreMuteFor === item.post.author.did &&
    moderation.isMute &&
    !moderation.noOverride
  ) {
    moderation = {behavior: ModerationBehaviorCode.Show}
  }

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
    (event: AccessibilityActionEvent) => {
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

  if (!record || deleted) {
    return <View />
  }

  return (
    <PostHider
      testID={`feedItem-by-${item.post.author.handle}`}
      style={outerStyles}
      href={itemHref}
      moderation={moderation}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}>
      {isThreadChild && (
        <View
          style={[styles.topReplyLine, {borderColor: pal.colors.replyLine}]}
        />
      )}
      {isThreadParent && (
        <View
          style={[styles.bottomReplyLine, {borderColor: pal.colors.replyLine}]}
        />
      )}
      {item.reasonRepost && (
        <Link
          style={styles.includeReason}
          href={`/profile/${item.reasonRepost.by.handle}`}
          title={sanitizeDisplayName(
            item.reasonRepost.by.displayName || item.reasonRepost.by.handle,
          )}>
          <FontAwesomeIcon
            icon="retweet"
            style={[
              styles.includeReasonIcon,
              {color: pal.colors.textLight} as FontAwesomeIconStyle,
            ]}
          />
          <Text
            type="sm-bold"
            style={pal.textLight}
            lineHeight={1.2}
            numberOfLines={1}>
            Reposted by{' '}
            <DesktopWebTextLink
              type="sm-bold"
              style={pal.textLight}
              lineHeight={1.2}
              numberOfLines={1}
              text={sanitizeDisplayName(
                item.reasonRepost.by.displayName || item.reasonRepost.by.handle,
              )}
              href={`/profile/${item.reasonRepost.by.handle}`}
            />
          </Text>
        </Link>
      )}
      <PostSandboxWarning />
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <Link href={authorHref} title={item.post.author.handle} asAnchor>
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
            showFollowBtn={showFollowBtn}
          />
          {!isThreadChild && replyAuthorDid !== '' && (
            <View style={[s.flexRow, s.mb2, s.alignCenter]}>
              <FontAwesomeIcon
                icon="reply"
                size={9}
                style={[
                  {color: pal.colors.textLight} as FontAwesomeIconStyle,
                  s.mr5,
                ]}
              />
              <Text
                type="md"
                style={[pal.textLight, s.mr2]}
                lineHeight={1.2}
                numberOfLines={1}>
                Reply to{' '}
                <UserInfoText
                  type="md"
                  did={replyAuthorDid}
                  attr="displayName"
                  style={[pal.textLight, s.ml2]}
                />
              </Text>
            </View>
          )}
          <ContentHider
            moderation={moderation}
            containerStyle={styles.contentHider}>
            {item.richText?.text ? (
              <View style={styles.postTextContainer}>
                <RichText
                  type="post-text"
                  richText={item.richText}
                  lineHeight={1.3}
                  style={s.flex1}
                />
              </View>
            ) : undefined}
            <ImageHider moderation={item.moderation.list} style={styles.embed}>
              <PostEmbeds embed={item.post.embed} style={styles.embed} />
            </ImageHider>
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
            style={styles.ctrls}
            itemUri={itemUri}
            itemCid={itemCid}
            itemHref={itemHref}
            itemTitle={itemTitle}
            author={{
              avatar: item.post.author.avatar!,
              handle: item.post.author.handle,
              displayName: item.post.author.displayName!,
            }}
            text={item.richText?.text || record.text}
            indexedAt={item.post.indexedAt}
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
})

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    padding: 10,
    paddingRight: 15,
    paddingBottom: 8,
  },
  outerSmallTop: {
    borderTopWidth: 0,
  },
  outerNoBottom: {
    paddingBottom: 2,
  },
  topReplyLine: {
    position: 'absolute',
    left: 42,
    top: 0,
    height: 6,
    borderLeftWidth: 2,
  },
  bottomReplyLine: {
    position: 'absolute',
    left: 42,
    top: 72,
    bottom: 0,
    borderLeftWidth: 2,
  },
  includeReason: {
    flexDirection: 'row',
    paddingLeft: 50,
    paddingRight: 20,
    marginTop: 2,
    marginBottom: 2,
  },
  includeReasonIcon: {
    marginRight: 4,
  },
  layout: {
    flexDirection: 'row',
    marginTop: 1,
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
    paddingBottom: 4,
  },
  contentHider: {
    marginTop: 4,
  },
  embed: {
    marginBottom: 6,
  },
  translateLink: {
    marginBottom: 6,
  },
  ctrls: {
    marginTop: 4,
  },
})
