import React, {memo, useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_TOMBSTONE, Shadow, usePostShadow} from '#/state/cache/post-shadow'
import {useLanguagePrefs} from '#/state/preferences'
import {useOpenLink} from '#/state/preferences/in-app-browser'
import {ThreadPost} from '#/state/queries/post-thread'
import {useComposerControls} from '#/state/shell/composer'
import {MAX_POST_LINES} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {countLines} from 'lib/strings/helpers'
import {niceDate} from 'lib/strings/time'
import {s} from 'lib/styles'
import {isWeb} from 'platform/detection'
import {useSession} from 'state/session'
import {PostThreadFollowBtn} from 'view/com/post-thread/PostThreadFollowBtn'
import {atoms as a} from '#/alf'
import {RichText} from '#/components/RichText'
import {ContentHider} from '../../../components/moderation/ContentHider'
import {LabelsOnMyPost} from '../../../components/moderation/LabelsOnMe'
import {PostAlerts} from '../../../components/moderation/PostAlerts'
import {PostHider} from '../../../components/moderation/PostHider'
import {WhoCanReply} from '../../../components/WhoCanReply'
import {getTranslatorLink, isPostInLanguage} from '../../../locale/helpers'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Link, TextLink} from '../util/Link'
import {formatCount} from '../util/numeric/format'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostEmbeds} from '../util/post-embeds'
import {PostMeta} from '../util/PostMeta'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import hairlineWidth = StyleSheet.hairlineWidth

export function PostThreadItem({
  post,
  record,
  moderation,
  treeView,
  depth,
  prevPost,
  nextPost,
  isHighlightedPost,
  hasMore,
  showChildReplyLine,
  showParentReplyLine,
  hasPrecedingItem,
  overrideBlur,
  onPostReply,
  hideTopBorder,
}: {
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  moderation: ModerationDecision | undefined
  treeView: boolean
  depth: number
  prevPost: ThreadPost | undefined
  nextPost: ThreadPost | undefined
  isHighlightedPost?: boolean
  hasMore?: boolean
  showChildReplyLine?: boolean
  showParentReplyLine?: boolean
  hasPrecedingItem: boolean
  overrideBlur: boolean
  onPostReply: () => void
  hideTopBorder?: boolean
}) {
  const postShadowed = usePostShadow(post)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )
  if (postShadowed === POST_TOMBSTONE) {
    return <PostThreadItemDeleted hideTopBorder={hideTopBorder} />
  }
  if (richText && moderation) {
    return (
      <PostThreadItemLoaded
        // Safeguard from clobbering per-post state below:
        key={postShadowed.uri}
        post={postShadowed}
        prevPost={prevPost}
        nextPost={nextPost}
        record={record}
        richText={richText}
        moderation={moderation}
        treeView={treeView}
        depth={depth}
        isHighlightedPost={isHighlightedPost}
        hasMore={hasMore}
        showChildReplyLine={showChildReplyLine}
        showParentReplyLine={showParentReplyLine}
        hasPrecedingItem={hasPrecedingItem}
        overrideBlur={overrideBlur}
        onPostReply={onPostReply}
        hideTopBorder={hideTopBorder}
      />
    )
  }
  return null
}

function PostThreadItemDeleted({hideTopBorder}: {hideTopBorder?: boolean}) {
  const pal = usePalette('default')
  return (
    <View
      style={[
        styles.outer,
        pal.border,
        pal.view,
        s.p20,
        s.flexRow,
        hideTopBorder && styles.noTopBorder,
      ]}>
      <FontAwesomeIcon icon={['far', 'trash-can']} color={pal.colors.icon} />
      <Text style={[pal.textLight, s.ml10]}>
        <Trans>This post has been deleted.</Trans>
      </Text>
    </View>
  )
}

let PostThreadItemLoaded = ({
  post,
  record,
  richText,
  moderation,
  treeView,
  depth,
  prevPost,
  nextPost,
  isHighlightedPost,
  hasMore,
  showChildReplyLine,
  showParentReplyLine,
  hasPrecedingItem,
  overrideBlur,
  onPostReply,
  hideTopBorder,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  moderation: ModerationDecision
  treeView: boolean
  depth: number
  prevPost: ThreadPost | undefined
  nextPost: ThreadPost | undefined
  isHighlightedPost?: boolean
  hasMore?: boolean
  showChildReplyLine?: boolean
  showParentReplyLine?: boolean
  hasPrecedingItem: boolean
  overrideBlur: boolean
  onPostReply: () => void
  hideTopBorder?: boolean
}): React.ReactNode => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const {openComposer} = useComposerControls()
  const [limitLines, setLimitLines] = React.useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const {currentAccount} = useSession()
  const rootUri = record.reply?.root?.uri || post.uri
  const postHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const itemTitle = _(msg`Post by ${post.author.handle}`)
  const authorHref = makeProfileLink(post.author)
  const authorTitle = post.author.handle
  const isThreadAuthor = getThreadAuthor(post, record) === currentAccount?.did
  const likesHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  }, [post.uri, post.author])
  const likesTitle = _(msg`Likes on this post`)
  const repostsHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by')
  }, [post.uri, post.author])
  const repostsTitle = _(msg`Reposts of this post`)

  const translatorUrl = getTranslatorLink(
    record?.text || '',
    langPrefs.primaryLanguage,
  )
  const needsTranslation = useMemo(
    () =>
      Boolean(
        langPrefs.primaryLanguage &&
          !isPostInLanguage(post, [langPrefs.primaryLanguage]),
      ),
    [post, langPrefs.primaryLanguage],
  )

  const onPressReply = React.useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
      },
      onPost: onPostReply,
    })
  }, [openComposer, post, record, onPostReply, moderation])

  const onPressShowMore = React.useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  if (!record) {
    return <ErrorMessage message={_(msg`Invalid or unsupported post record`)} />
  }

  if (isHighlightedPost) {
    return (
      <>
        {rootUri !== post.uri && (
          <View style={{paddingLeft: 16, flexDirection: 'row', height: 16}}>
            <View style={{width: 38}}>
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

        <View
          testID={`postThreadItem-by-${post.author.handle}`}
          style={[
            styles.outer,
            styles.outerHighlighted,
            pal.border,
            pal.view,
            rootUri === post.uri && styles.outerHighlightedRoot,
            hideTopBorder && styles.noTopBorder,
          ]}
          accessible={false}>
          <View style={[styles.layout]}>
            <View style={[styles.layoutAvi, {paddingBottom: 8}]}>
              <PreviewableUserAvatar
                size={42}
                profile={post.author}
                moderation={moderation.ui('avatar')}
                type={post.author.associated?.labeler ? 'labeler' : 'user'}
              />
            </View>
            <View style={styles.layoutContent}>
              <View
                style={[styles.meta, styles.metaExpandedLine1, {zIndex: 1}]}>
                <Link style={s.flex1} href={authorHref} title={authorTitle}>
                  <Text
                    type="xl-bold"
                    style={[pal.text, a.self_start]}
                    numberOfLines={1}
                    lineHeight={1.2}>
                    {sanitizeDisplayName(
                      post.author.displayName ||
                        sanitizeHandle(post.author.handle),
                      moderation.ui('displayName'),
                    )}
                  </Text>
                </Link>
              </View>
              <View style={styles.meta}>
                <Link style={s.flex1} href={authorHref} title={authorTitle}>
                  <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                    {sanitizeHandle(post.author.handle, '@')}
                  </Text>
                </Link>
              </View>
            </View>
            {currentAccount?.did !== post.author.did && (
              <PostThreadFollowBtn did={post.author.did} />
            )}
          </View>
          <View style={[s.pl10, s.pr10, s.pb10]}>
            <LabelsOnMyPost post={post} />
            <ContentHider
              modui={moderation.ui('contentView')}
              ignoreMute
              style={styles.contentHider}
              childContainerStyle={styles.contentHiderChild}>
              <PostAlerts
                modui={moderation.ui('contentView')}
                size="lg"
                includeMute
                style={[a.pt_2xs, a.pb_sm]}
              />
              {richText?.text ? (
                <View
                  style={[
                    styles.postTextContainer,
                    styles.postTextLargeContainer,
                  ]}>
                  <RichText
                    enableTags
                    selectable
                    value={richText}
                    style={[a.flex_1, a.text_xl]}
                    authorHandle={post.author.handle}
                  />
                </View>
              ) : undefined}
              {post.embed && (
                <View style={[a.pb_sm]}>
                  <PostEmbeds embed={post.embed} moderation={moderation} />
                </View>
              )}
            </ContentHider>
            <ExpandedPostDetails
              post={post}
              isThreadAuthor={isThreadAuthor}
              translatorUrl={translatorUrl}
              needsTranslation={needsTranslation}
            />
            {post.repostCount !== 0 || post.likeCount !== 0 ? (
              // Show this section unless we're *sure* it has no engagement.
              <View style={[styles.expandedInfo, pal.border]}>
                {post.repostCount != null && post.repostCount !== 0 ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={repostsHref}
                    title={repostsTitle}>
                    <Text
                      testID="repostCount-expanded"
                      type="lg"
                      style={pal.textLight}>
                      <Text type="xl-bold" style={pal.text}>
                        {formatCount(post.repostCount)}
                      </Text>{' '}
                      <Plural
                        value={post.repostCount}
                        one="repost"
                        other="reposts"
                      />
                    </Text>
                  </Link>
                ) : null}
                {post.likeCount != null && post.likeCount !== 0 ? (
                  <Link
                    style={styles.expandedInfoItem}
                    href={likesHref}
                    title={likesTitle}>
                    <Text
                      testID="likeCount-expanded"
                      type="lg"
                      style={pal.textLight}>
                      <Text type="xl-bold" style={pal.text}>
                        {formatCount(post.likeCount)}
                      </Text>{' '}
                      <Plural value={post.likeCount} one="like" other="likes" />
                    </Text>
                  </Link>
                ) : null}
              </View>
            ) : null}
            <View style={[s.pl10, s.pr10]}>
              <PostCtrls
                big
                post={post}
                record={record}
                richText={richText}
                onPressReply={onPressReply}
                logContext="PostThreadItem"
              />
            </View>
          </View>
        </View>
      </>
    )
  } else {
    const isThreadedChild = treeView && depth > 0
    const isThreadedChildAdjacentTop =
      isThreadedChild && prevPost?.ctx.depth === depth && depth !== 1
    const isThreadedChildAdjacentBot =
      isThreadedChild && nextPost?.ctx.depth === depth
    return (
      <PostOuterWrapper
        post={post}
        depth={depth}
        showParentReplyLine={!!showParentReplyLine}
        treeView={treeView}
        hasPrecedingItem={hasPrecedingItem}
        hideTopBorder={hideTopBorder}>
        <PostHider
          testID={`postThreadItem-by-${post.author.handle}`}
          href={postHref}
          disabled={overrideBlur}
          style={[pal.view]}
          modui={moderation.ui('contentList')}
          iconSize={isThreadedChild ? 26 : 38}
          iconStyles={
            isThreadedChild ? {marginRight: 4} : {marginLeft: 2, marginRight: 2}
          }
          profile={post.author}
          interpretFilterAsBlur>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingLeft: 8,
              height: isThreadedChildAdjacentTop ? 8 : 16,
            }}>
            <View style={{width: 38}}>
              {!isThreadedChild && showParentReplyLine && (
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
                paddingBottom:
                  showChildReplyLine && !isThreadedChild
                    ? 0
                    : isThreadedChildAdjacentBot
                    ? 4
                    : 8,
              },
            ]}>
            {/* If we are in threaded mode, the avatar is rendered in PostMeta */}
            {!isThreadedChild && (
              <View style={styles.layoutAvi}>
                <PreviewableUserAvatar
                  size={38}
                  profile={post.author}
                  moderation={moderation.ui('avatar')}
                  type={post.author.associated?.labeler ? 'labeler' : 'user'}
                />

                {showChildReplyLine && (
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
            )}

            <View
              style={
                isThreadedChild
                  ? styles.layoutContentThreaded
                  : styles.layoutContent
              }>
              <PostMeta
                author={post.author}
                moderation={moderation}
                authorHasWarning={!!post.author.labels?.length}
                timestamp={post.indexedAt}
                postHref={postHref}
                showAvatar={isThreadedChild}
                avatarModeration={moderation.ui('avatar')}
                avatarSize={28}
                displayNameType="md-bold"
                displayNameStyle={isThreadedChild && s.ml2}
                style={
                  isThreadedChild && {
                    alignItems: 'center',
                    paddingBottom: isWeb ? 5 : 2,
                  }
                }
              />
              <LabelsOnMyPost post={post} />
              <PostAlerts
                modui={moderation.ui('contentList')}
                style={[a.pt_2xs, a.pb_2xs]}
              />
              {richText?.text ? (
                <View style={styles.postTextContainer}>
                  <RichText
                    enableTags
                    value={richText}
                    style={[a.flex_1, a.text_md]}
                    numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                    authorHandle={post.author.handle}
                  />
                </View>
              ) : undefined}
              {limitLines ? (
                <TextLink
                  text={_(msg`Show More`)}
                  style={pal.link}
                  onPress={onPressShowMore}
                  href="#"
                />
              ) : undefined}
              {post.embed && (
                <View style={[a.pb_xs]}>
                  <PostEmbeds embed={post.embed} moderation={moderation} />
                </View>
              )}
              <PostCtrls
                post={post}
                record={record}
                richText={richText}
                onPressReply={onPressReply}
                logContext="PostThreadItem"
              />
            </View>
          </View>
          {hasMore ? (
            <Link
              style={[
                styles.loadMore,
                {
                  paddingLeft: treeView ? 8 : 70,
                  paddingTop: 0,
                  paddingBottom: treeView ? 4 : 12,
                },
              ]}
              href={postHref}
              title={itemTitle}
              noFeedback>
              <Text type="sm-medium" style={pal.textLight}>
                <Trans>More</Trans>
              </Text>
              <FontAwesomeIcon
                icon="angle-right"
                color={pal.colors.textLight}
                size={14}
              />
            </Link>
          ) : undefined}
        </PostHider>
      </PostOuterWrapper>
    )
  }
}
PostThreadItemLoaded = memo(PostThreadItemLoaded)

function PostOuterWrapper({
  post,
  treeView,
  depth,
  showParentReplyLine,
  hasPrecedingItem,
  hideTopBorder,
  children,
}: React.PropsWithChildren<{
  post: AppBskyFeedDefs.PostView
  treeView: boolean
  depth: number
  showParentReplyLine: boolean
  hasPrecedingItem: boolean
  hideTopBorder?: boolean
}>) {
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  if (treeView && depth > 0) {
    return (
      <View
        style={[
          pal.border,
          styles.cursor,
          {
            flexDirection: 'row',
            paddingHorizontal: isMobile ? 10 : 6,
            borderTopWidth: depth === 1 ? hairlineWidth : 0,
          },
        ]}>
        {Array.from(Array(depth - 1)).map((_, n: number) => (
          <View
            key={`${post.uri}-padding-${n}`}
            style={{
              borderLeftWidth: 2,
              borderLeftColor: pal.colors.border,
              marginLeft: isMobile ? 6 : 12,
              paddingLeft: isMobile ? 6 : 8,
            }}
          />
        ))}
        <View style={{flex: 1}}>{children}</View>
      </View>
    )
  }
  return (
    <View
      style={[
        styles.outer,
        pal.border,
        showParentReplyLine && hasPrecedingItem && styles.noTopBorder,
        hideTopBorder && styles.noTopBorder,
        styles.cursor,
      ]}>
      {children}
    </View>
  )
}

function ExpandedPostDetails({
  post,
  isThreadAuthor,
  needsTranslation,
  translatorUrl,
}: {
  post: AppBskyFeedDefs.PostView
  isThreadAuthor: boolean
  needsTranslation: boolean
  translatorUrl: string
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const openLink = useOpenLink()

  const onTranslatePress = React.useCallback(() => {
    openLink(translatorUrl)
  }, [openLink, translatorUrl])

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.flex_wrap,
        a.gap_sm,
        s.mt2,
        s.mb10,
      ]}>
      <Text style={[a.text_sm, pal.textLight]}>{niceDate(post.indexedAt)}</Text>
      <WhoCanReply post={post} isThreadAuthor={isThreadAuthor} />
      {needsTranslation && (
        <>
          <Text style={[a.text_sm, pal.textLight]}>&middot;</Text>

          <Text
            style={[a.text_sm, pal.link]}
            title={_(msg`Translate`)}
            onPress={onTranslatePress}>
            <Trans>Translate</Trans>
          </Text>
        </>
      )}
    </View>
  )
}

function getThreadAuthor(
  post: AppBskyFeedDefs.PostView,
  record: AppBskyFeedPost.Record,
): string {
  if (!record.reply) {
    return post.author.did
  }
  try {
    return new AtUri(record.reply.root.uri).host
  } catch {
    return ''
  }
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: hairlineWidth,
    paddingLeft: 8,
  },
  outerHighlighted: {
    borderTopWidth: 0,
    paddingTop: 4,
    paddingLeft: 8,
    paddingRight: 8,
  },
  outerHighlightedRoot: {
    borderTopWidth: hairlineWidth,
    paddingTop: 16,
  },
  noTopBorder: {
    borderTopWidth: 0,
  },
  layout: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  layoutAvi: {},
  layoutContent: {
    flex: 1,
    marginLeft: 10,
  },
  layoutContentThreaded: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  metaExpandedLine1: {
    paddingVertical: 0,
  },
  alert: {
    marginBottom: 6,
  },
  postTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 4,
    paddingRight: 10,
  },
  postTextLargeContainer: {
    paddingHorizontal: 0,
    paddingRight: 0,
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
    borderTopWidth: hairlineWidth,
    borderBottomWidth: hairlineWidth,
    marginTop: 5,
    marginBottom: 10,
  },
  expandedInfoItem: {
    marginRight: 10,
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    paddingHorizontal: 20,
  },
  replyLine: {
    width: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  cursor: {
    // @ts-ignore web only
    cursor: 'pointer',
  },
})
