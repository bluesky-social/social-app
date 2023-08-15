import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {Linking, StyleSheet, View} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {AtUri, AppBskyFeedDefs} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostThreadItemModel} from 'state/models/content/post-thread-item'
import {Link} from '../util/Link'
import {RichText} from '../util/text/RichText'
import {Text} from '../util/text/Text'
import {PostDropdownBtn} from '../util/forms/PostDropdownBtn'
import * as Toast from '../util/Toast'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {niceDate} from 'lib/strings/time'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {pluralize} from 'lib/strings/helpers'
import {getTranslatorLink, isPostInLanguage} from '../../../locale/helpers'
import {useStores} from 'state/index'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/post-embeds'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostHider} from '../util/moderation/PostHider'
import {ContentHider} from '../util/moderation/ContentHider'
import {PostAlerts} from '../util/moderation/PostAlerts'
import {PostSandboxWarning} from '../util/PostSandboxWarning'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {usePalette} from 'lib/hooks/usePalette'
import {formatCount} from '../util/numeric/format'
import {TimeElapsed} from 'view/com/util/TimeElapsed'
import {makeProfileLink} from 'lib/routes/links'

export const PostThreadItem = observer(function PostThreadItem({
  item,
  onPostReply,
}: {
  item: PostThreadItemModel
  onPostReply: () => void
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [deleted, setDeleted] = React.useState(false)
  const record = item.postRecord
  const hasEngagement = item.post.likeCount || item.post.repostCount

  const itemUri = item.post.uri
  const itemCid = item.post.cid
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return makeProfileLink(item.post.author, 'post', urip.rkey)
  }, [item.post.uri, item.post.author])
  const itemTitle = `Post by ${item.post.author.handle}`
  const authorHref = makeProfileLink(item.post.author)
  const authorTitle = item.post.author.handle
  const likesHref = React.useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return makeProfileLink(item.post.author, 'post', urip.rkey, 'liked-by')
  }, [item.post.uri, item.post.author])
  const likesTitle = 'Likes on this post'
  const repostsHref = React.useMemo(() => {
    const urip = new AtUri(item.post.uri)
    return makeProfileLink(item.post.author, 'post', urip.rkey, 'reposted-by')
  }, [item.post.uri, item.post.author])
  const repostsTitle = 'Reposts of this post'

  const primaryLanguage = store.preferences.contentLanguages[0] || 'en'
  const translatorUrl = getTranslatorLink(primaryLanguage, record?.text || '')
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
        text: record?.text as string,
        author: {
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
      },
      onPost: onPostReply,
    })
  }, [store, item, record, onPostReply])

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
    Clipboard.setString(record?.text || '')
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
  }, [item, store])

  if (!record) {
    return <ErrorMessage message="Invalid or unsupported post record" />
  }

  if (deleted) {
    return (
      <View style={[styles.outer, pal.border, pal.view, s.p20, s.flexRow]}>
        <FontAwesomeIcon
          icon={['far', 'trash-can']}
          style={pal.icon as FontAwesomeIconStyle}
        />
        <Text style={[pal.textLight, s.ml10]}>This post has been deleted.</Text>
      </View>
    )
  }

  if (item._isHighlightedPost) {
    return (
      <>
        {item.rootUri !== item.uri && (
          <View style={{paddingLeft: 18, flexDirection: 'row', height: 16}}>
            <View style={{width: 52}}>
              <View
                style={[
                  styles.replyLine,
                  {
                    flexGrow: 1,
                    backgroundColor: pal.colors.replyLine,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <Link
          testID={`postThreadItem-by-${item.post.author.handle}`}
          style={[styles.outer, styles.outerHighlighted, pal.border, pal.view]}
          noFeedback
          accessible={false}>
          <PostSandboxWarning />
          <View style={styles.layout}>
            <View style={[styles.layoutAvi, {paddingBottom: 8}]}>
              <PreviewableUserAvatar
                size={52}
                did={item.post.author.did}
                handle={item.post.author.handle}
                avatar={item.post.author.avatar}
                moderation={item.moderation.avatar}
              />
            </View>
            <View style={styles.layoutContent}>
              <View style={[styles.meta, styles.metaExpandedLine1]}>
                <View style={[s.flexRow]}>
                  <Link
                    style={styles.metaItem}
                    href={authorHref}
                    title={authorTitle}>
                    <Text
                      type="xl-bold"
                      style={[pal.text]}
                      numberOfLines={1}
                      lineHeight={1.2}>
                      {sanitizeDisplayName(
                        item.post.author.displayName ||
                          sanitizeHandle(item.post.author.handle),
                      )}
                    </Text>
                  </Link>
                  <Text type="md" style={[styles.metaItem, pal.textLight]}>
                    &middot;&nbsp;
                    <TimeElapsed timestamp={item.post.indexedAt}>
                      {({timeElapsed}) => <>{timeElapsed}</>}
                    </TimeElapsed>
                  </Text>
                </View>
              </View>
              <View style={styles.meta}>
                <Link
                  style={styles.metaItem}
                  href={authorHref}
                  title={authorTitle}>
                  <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                    {sanitizeHandle(item.post.author.handle, '@')}
                  </Text>
                </Link>
              </View>
            </View>
            <View style={s.flex1} />
            <PostDropdownBtn
              testID="postDropdownBtn"
              itemUri={itemUri}
              itemCid={itemCid}
              itemHref={itemHref}
              itemTitle={itemTitle}
              isAuthor={item.post.author.did === store.me.did}
              isThreadMuted={item.isThreadMuted}
              onCopyPostText={onCopyPostText}
              onOpenTranslate={onOpenTranslate}
              onToggleThreadMute={onToggleThreadMute}
              onDeletePost={onDeletePost}
              style={{paddingVertical: 6, paddingHorizontal: 10}}
            />
          </View>
          <View style={[s.pl10, s.pr10, s.pb10]}>
            <ContentHider
              moderation={item.moderation.content}
              ignoreMute
              style={styles.contentHider}
              childContainerStyle={styles.contentHiderChild}>
              <PostAlerts
                moderation={item.moderation.content}
                includeMute
                style={styles.alert}
              />
              {item.richText?.text ? (
                <View
                  style={[
                    styles.postTextContainer,
                    styles.postTextLargeContainer,
                  ]}>
                  <RichText
                    type="post-text-lg"
                    richText={item.richText}
                    lineHeight={1.3}
                    style={s.flex1}
                  />
                </View>
              ) : undefined}
              {item.post.embed && (
                <ContentHider moderation={item.moderation.embed} style={s.mb10}>
                  <PostEmbeds
                    embed={item.post.embed}
                    moderation={item.moderation.embed}
                  />
                </ContentHider>
              )}
            </ContentHider>
            <ExpandedPostDetails
              post={item.post}
              translatorUrl={translatorUrl}
              needsTranslation={needsTranslation}
            />
            {hasEngagement ? (
              <View style={[styles.expandedInfo, pal.border]}>
                {item.post.repostCount ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={repostsHref}
                    title={repostsTitle}>
                    <Text testID="repostCount" type="lg" style={pal.textLight}>
                      <Text type="xl-bold" style={pal.text}>
                        {formatCount(item.post.repostCount)}
                      </Text>{' '}
                      {pluralize(item.post.repostCount, 'repost')}
                    </Text>
                  </Link>
                ) : (
                  <></>
                )}
                {item.post.likeCount ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={likesHref}
                    title={likesTitle}>
                    <Text testID="likeCount" type="lg" style={pal.textLight}>
                      <Text type="xl-bold" style={pal.text}>
                        {formatCount(item.post.likeCount)}
                      </Text>{' '}
                      {pluralize(item.post.likeCount, 'like')}
                    </Text>
                  </Link>
                ) : (
                  <></>
                )}
              </View>
            ) : (
              <></>
            )}
            <View style={[s.pl10, s.pb5]}>
              <PostCtrls
                big
                itemUri={itemUri}
                itemCid={itemCid}
                itemHref={itemHref}
                itemTitle={itemTitle}
                author={item.post.author}
                text={item.richText?.text || record.text}
                indexedAt={item.post.indexedAt}
                isAuthor={item.post.author.did === store.me.did}
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
      </>
    )
  } else {
    return (
      <>
        <PostHider
          testID={`postThreadItem-by-${item.post.author.handle}`}
          href={itemHref}
          style={[
            styles.outer,
            pal.border,
            pal.view,
            item._showParentReplyLine && styles.noTopBorder,
            !item._showChildReplyLine && {borderBottomWidth: 1},
          ]}
          moderation={item.moderation.content}>
          <PostSandboxWarning />

          <View
            style={{flexDirection: 'row', gap: 10, paddingLeft: 8, height: 16}}>
            <View style={{width: 52}}>
              {item._showParentReplyLine && (
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
          </View>

          <View
            style={[
              styles.layout,
              {
                paddingBottom: item._showChildReplyLine ? 0 : 8,
              },
            ]}>
            <View style={styles.layoutAvi}>
              <PreviewableUserAvatar
                size={52}
                did={item.post.author.did}
                handle={item.post.author.handle}
                avatar={item.post.author.avatar}
                moderation={item.moderation.avatar}
              />

              {item._showChildReplyLine && (
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
              <PostAlerts
                moderation={item.moderation.content}
                style={styles.alert}
              />
              {item.richText?.text ? (
                <View style={styles.postTextContainer}>
                  <RichText
                    type="post-text"
                    richText={item.richText}
                    style={[pal.text, s.flex1]}
                    lineHeight={1.3}
                  />
                </View>
              ) : undefined}
              {item.post.embed && (
                <ContentHider
                  style={styles.contentHider}
                  moderation={item.moderation.embed}>
                  <PostEmbeds
                    embed={item.post.embed}
                    moderation={item.moderation.embed}
                  />
                </ContentHider>
              )}
              {needsTranslation && (
                <View style={[pal.borderDark, styles.translateLink]}>
                  <Link href={translatorUrl} title="Translate">
                    <Text type="sm" style={pal.link}>
                      Translate this post
                    </Text>
                  </Link>
                </View>
              )}
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
        </PostHider>
        {item._hasMore ? (
          <Link
            style={[
              styles.loadMore,
              {borderBottomColor: pal.colors.border},
              pal.view,
            ]}
            href={itemHref}
            title={itemTitle}
            noFeedback>
            <Text style={pal.link}>Continue thread...</Text>
            <FontAwesomeIcon
              icon="angle-right"
              style={pal.link as FontAwesomeIconStyle}
              size={18}
            />
          </Link>
        ) : undefined}
      </>
    )
  }
})

function ExpandedPostDetails({
  post,
  needsTranslation,
  translatorUrl,
}: {
  post: AppBskyFeedDefs.PostView
  needsTranslation: boolean
  translatorUrl: string
}) {
  const pal = usePalette('default')
  return (
    <View style={[s.flexRow, s.mt2, s.mb10]}>
      <Text style={pal.textLight}>{niceDate(post.indexedAt)}</Text>
      {needsTranslation && (
        <>
          <Text style={pal.textLight}> • </Text>
          <Link href={translatorUrl} title="Translate">
            <Text style={pal.link}>Translate</Text>
          </Link>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingLeft: 10,
  },
  outerHighlighted: {
    paddingTop: 16,
    paddingLeft: 10,
    paddingRight: 10,
  },
  noTopBorder: {
    borderTopWidth: 0,
  },
  layout: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 8,
  },
  layoutAvi: {},
  layoutContent: {
    flex: 1,
    paddingRight: 10,
  },
  meta: {
    flexDirection: 'row',
    paddingTop: 2,
    paddingBottom: 2,
  },
  metaExpandedLine1: {
    paddingTop: 5,
    paddingBottom: 0,
  },
  metaItem: {
    paddingRight: 5,
    maxWidth: 240,
  },
  alert: {
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 8,
    paddingRight: 10,
  },
  postTextLargeContainer: {
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  translateLink: {
    marginBottom: 6,
  },
  contentHider: {
    marginBottom: 6,
  },
  contentHiderChild: {
    marginTop: 6,
  },
  expandedInfo: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 5,
    marginBottom: 15,
  },
  expandedInfoItem: {
    marginRight: 10,
  },
  loadMore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingLeft: 80,
    paddingRight: 20,
    paddingVertical: 12,
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
})
