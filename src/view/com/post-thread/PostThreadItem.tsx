import React, {memo, useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AtUri,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  RichText as RichTextAPI,
  moderatePost,
  PostModeration,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Link, TextLink} from '../util/Link'
import {RichText} from '../util/text/RichText'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {niceDate} from 'lib/strings/time'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {countLines, pluralize} from 'lib/strings/helpers'
import {isEmbedByEmbedder} from 'lib/embeds'
import {getTranslatorLink, isPostInLanguage} from '../../../locale/helpers'
import {PostMeta} from '../util/PostMeta'
import {PostEmbeds} from '../util/post-embeds'
import {PostCtrls} from '../util/post-ctrls/PostCtrls'
import {PostDropdownBtn} from '../util/forms/PostDropdownBtn'
import {PostHider} from '../util/moderation/PostHider'
import {ContentHider} from '../util/moderation/ContentHider'
import {PostAlerts} from '../util/moderation/PostAlerts'
import {PostSandboxWarning} from '../util/PostSandboxWarning'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {usePalette} from 'lib/hooks/usePalette'
import {formatCount} from '../util/numeric/format'
import {TimeElapsed} from 'view/com/util/TimeElapsed'
import {makeProfileLink} from 'lib/routes/links'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {MAX_POST_LINES} from 'lib/constants'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useLanguagePrefs} from '#/state/preferences'
import {useComposerControls} from '#/state/shell/composer'
import {useModerationOpts} from '#/state/queries/preferences'
import {Shadow, usePostShadow, POST_TOMBSTONE} from '#/state/cache/post-shadow'
import {ThreadPost} from '#/state/queries/post-thread'
import {LabelInfo} from '../util/moderation/LabelInfo'
import {useSession} from '#/state/session'
import {WhoCanReply} from '../threadgate/WhoCanReply'

export function PostThreadItem({
  post,
  record,
  treeView,
  depth,
  prevPost,
  nextPost,
  isHighlightedPost,
  hasMore,
  showChildReplyLine,
  showParentReplyLine,
  hasPrecedingItem,
  onPostReply,
}: {
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  treeView: boolean
  depth: number
  prevPost: ThreadPost | undefined
  nextPost: ThreadPost | undefined
  isHighlightedPost?: boolean
  hasMore?: boolean
  showChildReplyLine?: boolean
  showParentReplyLine?: boolean
  hasPrecedingItem: boolean
  onPostReply: () => void
}) {
  const moderationOpts = useModerationOpts()
  const postShadowed = usePostShadow(post)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )
  const moderation = useMemo(
    () =>
      post && moderationOpts ? moderatePost(post, moderationOpts) : undefined,
    [post, moderationOpts],
  )
  if (postShadowed === POST_TOMBSTONE) {
    return <PostThreadItemDeleted />
  }
  if (richText && moderation) {
    return (
      <PostThreadItemLoaded
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
        onPostReply={onPostReply}
      />
    )
  }
  return null
}

function PostThreadItemDeleted() {
  const styles = useStyles()
  const pal = usePalette('default')
  return (
    <View style={[styles.outer, pal.border, pal.view, s.p20, s.flexRow]}>
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
  onPostReply,
}: {
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  moderation: PostModeration
  treeView: boolean
  depth: number
  prevPost: ThreadPost | undefined
  nextPost: ThreadPost | undefined
  isHighlightedPost?: boolean
  hasMore?: boolean
  showChildReplyLine?: boolean
  showParentReplyLine?: boolean
  hasPrecedingItem: boolean
  onPostReply: () => void
}): React.ReactNode => {
  const pal = usePalette('default')
  const langPrefs = useLanguagePrefs()
  const {openComposer} = useComposerControls()
  const {currentAccount} = useSession()
  const [limitLines, setLimitLines] = React.useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const styles = useStyles()
  const hasEngagement = post.likeCount || post.repostCount

  const rootUri = record.reply?.root?.uri || post.uri
  const postHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const itemTitle = `Post by ${post.author.handle}`
  const authorHref = makeProfileLink(post.author)
  const authorTitle = post.author.handle
  const isAuthorMuted = post.author.viewer?.muted
  const likesHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  }, [post.uri, post.author])
  const likesTitle = 'Likes on this post'
  const repostsHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by')
  }, [post.uri, post.author])
  const repostsTitle = 'Reposts of this post'

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
        author: {
          handle: post.author.handle,
          displayName: post.author.displayName,
          avatar: post.author.avatar,
        },
      },
      onPost: onPostReply,
    })
  }, [openComposer, post, record, onPostReply])

  const onPressShowMore = React.useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  if (!record) {
    return <ErrorMessage message="Invalid or unsupported post record" />
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
                    backgroundColor: pal.colors.border,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <Link
          testID={`postThreadItem-by-${post.author.handle}`}
          style={[styles.outer, styles.outerHighlighted, pal.border, pal.view]}
          noFeedback
          accessible={false}>
          <PostSandboxWarning />
          <View style={styles.layout}>
            <View style={[styles.layoutAvi, {paddingBottom: 8}]}>
              <PreviewableUserAvatar
                size={42}
                did={post.author.did}
                handle={post.author.handle}
                avatar={post.author.avatar}
                moderation={moderation.avatar}
              />
            </View>
            <View style={styles.layoutContent}>
              <View
                style={[styles.meta, styles.metaExpandedLine1, {zIndex: 1}]}>
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
                        post.author.displayName ||
                          sanitizeHandle(post.author.handle),
                      )}
                    </Text>
                  </Link>
                  <TimeElapsed timestamp={post.indexedAt}>
                    {({timeElapsed}) => (
                      <Text
                        type="md"
                        style={[styles.metaItem, pal.textLight]}
                        title={niceDate(post.indexedAt)}>
                        &middot;&nbsp;{timeElapsed}
                      </Text>
                    )}
                  </TimeElapsed>
                </View>
              </View>
              <View style={styles.meta}>
                {isAuthorMuted && (
                  <View
                    style={[
                      pal.viewLight,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        marginRight: 4,
                      },
                    ]}>
                    <FontAwesomeIcon
                      icon={['far', 'eye-slash']}
                      size={12}
                      color={pal.colors.textLight}
                    />
                    <Text type="sm-medium" style={pal.textLight}>
                      Muted
                    </Text>
                  </View>
                )}
                <Link
                  style={styles.metaItem}
                  href={authorHref}
                  title={authorTitle}>
                  <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                    {sanitizeHandle(post.author.handle, '@')}
                  </Text>
                </Link>
              </View>
            </View>
            <PostDropdownBtn
              testID="postDropdownBtn"
              postAuthor={post.author}
              postCid={post.cid}
              postUri={post.uri}
              record={record}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                marginLeft: 'auto',
                width: 40,
              }}
            />
          </View>
          <View style={[s.pl10, s.pr10, s.pb10]}>
            <ContentHider
              moderation={moderation.content}
              ignoreMute
              style={styles.contentHider}
              childContainerStyle={styles.contentHiderChild}>
              <PostAlerts
                moderation={moderation.content}
                includeMute
                style={styles.alert}
              />
              {post.author.did === currentAccount?.did ? (
                <LabelInfo
                  details={{uri: post.uri, cid: post.cid}}
                  labels={post.labels}
                  style={{marginBottom: 8}}
                />
              ) : null}
              {richText?.text ? (
                <View
                  style={[
                    styles.postTextContainer,
                    styles.postTextLargeContainer,
                  ]}>
                  <RichText
                    type="post-text-lg"
                    richText={richText}
                    lineHeight={1.3}
                    style={s.flex1}
                  />
                </View>
              ) : undefined}
              {post.embed && (
                <ContentHider
                  moderation={moderation.embed}
                  moderationDecisions={moderation.decisions}
                  ignoreMute={isEmbedByEmbedder(post.embed, post.author.did)}
                  ignoreQuoteDecisions
                  style={s.mb10}>
                  <PostEmbeds
                    embed={post.embed}
                    moderation={moderation.embed}
                    moderationDecisions={moderation.decisions}
                  />
                </ContentHider>
              )}
            </ContentHider>
            <ExpandedPostDetails
              post={post}
              translatorUrl={translatorUrl}
              needsTranslation={needsTranslation}
            />
            {hasEngagement ? (
              <View style={[styles.expandedInfo, pal.border]}>
                {post.repostCount ? (
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
                      {pluralize(post.repostCount, 'repost')}
                    </Text>
                  </Link>
                ) : (
                  <></>
                )}
                {post.likeCount ? (
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
                      {pluralize(post.likeCount, 'like')}
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
                post={post}
                record={record}
                onPressReply={onPressReply}
              />
            </View>
          </View>
        </Link>
        <WhoCanReply post={post} />
      </>
    )
  } else {
    const isThreadedChild = treeView && depth > 0
    const isThreadedChildAdjacentTop =
      isThreadedChild && prevPost?.ctx.depth === depth && depth !== 1
    const isThreadedChildAdjacentBot =
      isThreadedChild && nextPost?.ctx.depth === depth
    return (
      <>
        <PostOuterWrapper
          post={post}
          depth={depth}
          showParentReplyLine={!!showParentReplyLine}
          treeView={treeView}
          hasPrecedingItem={hasPrecedingItem}>
          <PostHider
            testID={`postThreadItem-by-${post.author.handle}`}
            href={postHref}
            style={[pal.view]}
            moderation={moderation.content}
            iconSize={isThreadedChild ? 26 : 38}
            iconStyles={
              isThreadedChild
                ? {marginRight: 4}
                : {marginLeft: 2, marginRight: 2}
            }>
            <PostSandboxWarning />

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
                        backgroundColor: pal.colors.border,
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
              {!isThreadedChild && (
                <View style={styles.layoutAvi}>
                  <PreviewableUserAvatar
                    size={38}
                    did={post.author.did}
                    handle={post.author.handle}
                    avatar={post.author.avatar}
                    moderation={moderation.avatar}
                  />

                  {showChildReplyLine && (
                    <View
                      style={[
                        styles.replyLine,
                        {
                          flexGrow: 1,
                          backgroundColor: pal.colors.border,
                          marginTop: 4,
                        },
                      ]}
                    />
                  )}
                </View>
              )}

              <View style={styles.layoutContent}>
                <PostMeta
                  author={post.author}
                  authorHasWarning={!!post.author.labels?.length}
                  timestamp={post.indexedAt}
                  postHref={postHref}
                  showAvatar={isThreadedChild}
                  avatarSize={28}
                  displayNameType="md-bold"
                  displayNameStyle={isThreadedChild && s.ml2}
                  style={isThreadedChild && s.mb2}
                />
                <PostAlerts
                  moderation={moderation.content}
                  style={styles.alert}
                />
                {richText?.text ? (
                  <View style={styles.postTextContainer}>
                    <RichText
                      type="post-text"
                      richText={richText}
                      style={[pal.text, s.flex1]}
                      lineHeight={1.3}
                      numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                    />
                  </View>
                ) : undefined}
                {limitLines ? (
                  <TextLink
                    text="Show More"
                    style={pal.link}
                    onPress={onPressShowMore}
                    href="#"
                  />
                ) : undefined}
                {post.embed && (
                  <ContentHider
                    style={styles.contentHider}
                    moderation={moderation.embed}
                    moderationDecisions={moderation.decisions}
                    ignoreMute={isEmbedByEmbedder(post.embed, post.author.did)}
                    ignoreQuoteDecisions>
                    <PostEmbeds
                      embed={post.embed}
                      moderation={moderation.embed}
                      moderationDecisions={moderation.decisions}
                    />
                  </ContentHider>
                )}
                <PostCtrls
                  post={post}
                  record={record}
                  onPressReply={onPressReply}
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
                  More
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
        <WhoCanReply
          post={post}
          style={{
            marginTop: 4,
          }}
        />
      </>
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
  children,
}: React.PropsWithChildren<{
  post: AppBskyFeedDefs.PostView
  treeView: boolean
  depth: number
  showParentReplyLine: boolean
  hasPrecedingItem: boolean
}>) {
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const styles = useStyles()
  if (treeView && depth > 0) {
    return (
      <View
        style={[
          pal.view,
          pal.border,
          styles.cursor,
          {
            flexDirection: 'row',
            paddingHorizontal: isMobile ? 10 : 6,
            borderTopWidth: depth === 1 ? 1 : 0,
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
        pal.view,
        pal.border,
        showParentReplyLine && hasPrecedingItem && styles.noTopBorder,
        styles.cursor,
      ]}>
      {children}
    </View>
  )
}

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
  const {_} = useLingui()
  return (
    <View style={[s.flexRow, s.mt2, s.mb10]}>
      <Text style={pal.textLight}>{niceDate(post.indexedAt)}</Text>
      {needsTranslation && (
        <>
          <Text style={[pal.textLight, s.ml5, s.mr5]}>•</Text>
          <Link href={translatorUrl} title={_(msg`Translate`)}>
            <Text style={pal.link}>
              <Trans>Translate</Trans>
            </Text>
          </Link>
        </>
      )}
    </View>
  )
}

const useStyles = () => {
  const {isDesktop} = useWebMediaQueries()
  return StyleSheet.create({
    outer: {
      borderTopWidth: 1,
      paddingLeft: 8,
    },
    outerHighlighted: {
      paddingTop: 16,
      paddingLeft: 8,
      paddingRight: 8,
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
      paddingTop: 0,
      paddingBottom: 0,
    },
    metaItem: {
      paddingRight: 5,
      maxWidth: isDesktop ? 380 : 220,
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
}
