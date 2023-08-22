import React, {useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {Linking, StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {Link, DesktopWebTextLink} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserInfoText} from '../util/UserInfoText'
import {PostMeta} from '../util/PostMeta'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {ContentHider} from '../util/moderation/ContentHider'
import {PostAlerts} from '../util/moderation/PostAlerts'
import {RichText} from '../util/text/RichText'
import {PostSandboxWarning} from '../util/PostSandboxWarning'
import * as Toast from '../util/Toast'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {getTranslatorLink, isPostInLanguage} from '../../../locale/helpers'
import {makeProfileLink} from 'lib/routes/links'

export const FeedItem = observer(function ({
  item,
  isThreadChild,
  isThreadLastChild,
  isThreadParent,
}: {
  item: PostsFeedItemModel
  isThreadChild?: boolean
  isThreadLastChild?: boolean
  isThreadParent?: boolean
  showReplyLine?: boolean
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
    return makeProfileLink(item.post.author, 'post', urip.rkey)
  }, [item.post.uri, item.post.author])
  const itemTitle = `Post by ${item.post.author.handle}`
  const replyAuthorDid = useMemo(() => {
    if (!record?.reply) {
      return ''
    }
    const urip = new AtUri(record.reply.parent?.uri || record.reply.root.uri)
    return urip.hostname
  }, [record?.reply])
  const translatorUrl = getTranslatorLink(record?.text || '')
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

  const outerStyles = [
    styles.outer,
    pal.view,
    {
      borderColor: pal.colors.border,
      paddingBottom:
        isThreadLastChild || (!isThreadChild && !isThreadParent)
          ? 6
          : undefined,
    },
    isThreadChild ? styles.outerSmallTop : undefined,
  ]

  if (!record || deleted) {
    return <View />
  }

  return (
    <Link
      testID={`feedItem-by-${item.post.author.handle}`}
      style={outerStyles}
      href={itemHref}
      noFeedback
      accessible={false}>
      <PostSandboxWarning />

      <View style={{flexDirection: 'row', gap: 10, paddingLeft: 8}}>
        <View style={{width: 52}}>
          {isThreadChild && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginBottom: 4,
                },
              ]}
            />
          )}
        </View>

        <View style={{paddingTop: 12}}>
          {item.reasonRepost && (
            <Link
              style={styles.includeReason}
              href={makeProfileLink(item.reasonRepost.by)}
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
                    item.reasonRepost.by.displayName ||
                      sanitizeHandle(item.reasonRepost.by.handle),
                  )}
                  href={makeProfileLink(item.reasonRepost.by)}
                />
              </Text>
            </Link>
          )}
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <PreviewableUserAvatar
            size={52}
            did={item.post.author.did}
            handle={item.post.author.handle}
            avatar={item.post.author.avatar}
            moderation={item.moderation.avatar}
          />
          {isThreadParent && (
            <View
              style={[
                styles.replyLine,
                {
                  flexGrow: 1,
                  backgroundColor: pal.colors.replyLine,
                  marginTop: 4,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.layoutContent}>
          <PostMeta
            author={item.post.author}
            authorHasWarning={!!item.post.author.labels?.length}
            timestamp={item.post.indexedAt}
            postHref={itemHref}
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
            testID="contentHider-post"
            moderation={item.moderation.content}
            ignoreMute
            childContainerStyle={styles.contentHiderChild}>
            <PostAlerts
              moderation={item.moderation.content}
              style={styles.alert}
            />
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
            {item.post.embed ? (
              <ContentHider
                testID="contentHider-embed"
                moderation={item.moderation.embed}
                style={styles.embed}>
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
    </Link>
  )
})

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingLeft: 10,
    paddingRight: 15,
  },
  outerSmallTop: {
    borderTopWidth: 0,
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  includeReason: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 4,
    marginLeft: -20,
  },
  includeReasonIcon: {
    marginRight: 4,
  },
  layout: {
    flexDirection: 'row',
    marginTop: 1,
    gap: 10,
  },
  layoutAvi: {
    paddingLeft: 8,
  },
  layoutContent: {
    flex: 1,
  },
  alert: {
    marginTop: 6,
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 4,
  },
  contentHiderChild: {
    marginTop: 6,
  },
  embed: {
    marginBottom: 6,
  },
  translateLink: {
    marginBottom: 6,
  },
})
