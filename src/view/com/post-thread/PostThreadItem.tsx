import {memo, useCallback, useMemo, useState} from 'react'
import {
  type GestureResponderEvent,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  type ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useActorStatus} from '#/lib/actor-status'
import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {countLines} from '#/lib/strings/helpers'
import {niceDate} from '#/lib/strings/time'
import {s} from '#/lib/styles'
import {getTranslatorLink, isPostInLanguage} from '#/locale/helpers'
import {logger} from '#/logger'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useLanguagePrefs} from '#/state/preferences'
import {type ThreadPost} from '#/state/queries/post-thread'
import {useSession} from '#/state/session'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {useUnstablePostSource} from '#/state/unstable-post-source'
import {PostThreadFollowBtn} from '#/view/com/post-thread/PostThreadFollowBtn'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {Link, TextLink} from '#/view/com/util/Link'
import {formatCount} from '#/view/com/util/numeric/format'
import {PostEmbeds, PostEmbedViewContext} from '#/view/com/util/post-embeds'
import {PostMeta} from '#/view/com/util/PostMeta'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {colors} from '#/components/Admonition'
import {Button} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {CalendarClock_Stroke2_Corner0_Rounded as CalendarClockIcon} from '#/components/icons/CalendarClock'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {InlineLinkText} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {PostHider} from '#/components/moderation/PostHider'
import {type AppModerationCause} from '#/components/Pills'
import {PostControls} from '#/components/PostControls'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import {Text} from '#/components/Typography'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import {WhoCanReply} from '#/components/WhoCanReply'
import * as bsky from '#/types/bsky'

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
  threadgateRecord,
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
  onPostReply: (postUri: string | undefined) => void
  hideTopBorder?: boolean
  threadgateRecord?: AppBskyFeedThreadgate.Record
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
        threadgateRecord={threadgateRecord}
      />
    )
  }
  return null
}

function PostThreadItemDeleted({hideTopBorder}: {hideTopBorder?: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.p_xl,
        a.pl_lg,
        a.flex_row,
        a.gap_md,
        !hideTopBorder && a.border_t,
      ]}>
      <TrashIcon style={[t.atoms.text]} />
      <Text style={[t.atoms.text_contrast_medium, a.mt_2xs]}>
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
  threadgateRecord,
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
  onPostReply: (postUri: string | undefined) => void
  hideTopBorder?: boolean
  threadgateRecord?: AppBskyFeedThreadgate.Record
}): React.ReactNode => {
  const {currentAccount, hasSession} = useSession()
  const source = useUnstablePostSource(post.uri)
  const feedFeedback = useFeedFeedback(source?.feed, hasSession)

  const t = useTheme()
  const pal = usePalette('default')
  const {_, i18n} = useLingui()
  const langPrefs = useLanguagePrefs()
  const {openComposer} = useOpenComposer()
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const shadowedPostAuthor = useProfileShadow(post.author)
  const rootUri = record.reply?.root?.uri || post.uri
  const postHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const itemTitle = _(msg`Post by ${post.author.handle}`)
  const authorHref = makeProfileLink(post.author)
  const authorTitle = post.author.handle
  const isThreadAuthor = getThreadAuthor(post, record) === currentAccount?.did
  const likesHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  }, [post.uri, post.author])
  const likesTitle = _(msg`Likes on this post`)
  const repostsHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by')
  }, [post.uri, post.author])
  const repostsTitle = _(msg`Reposts of this post`)
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
    const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri)
    const isControlledByViewer = new AtUri(rootUri).host === currentAccount?.did
    return isControlledByViewer && isPostHiddenByThreadgate
      ? [
          {
            type: 'reply-hidden',
            source: {type: 'user', did: currentAccount?.did},
            priority: 6,
          },
        ]
      : []
  }, [post, currentAccount?.did, threadgateHiddenReplies, rootUri])
  const quotesHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'quotes')
  }, [post.uri, post.author])
  const quotesTitle = _(msg`Quotes of this post`)
  const onlyFollowersCanReply = !!threadgateRecord?.allow?.find(
    rule => rule.$type === 'app.bsky.feed.threadgate#followerRule',
  )
  const showFollowButton =
    currentAccount?.did !== post.author.did && !onlyFollowersCanReply

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

  const onPressReply = () => {
    if (source) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionReply',
        feedContext: source.post.feedContext,
        reqId: source.post.reqId,
      })
    }
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
  }

  const onOpenAuthor = () => {
    if (source) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughAuthor',
        feedContext: source.post.feedContext,
        reqId: source.post.reqId,
      })
    }
  }

  const onOpenEmbed = () => {
    if (source) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughEmbed',
        feedContext: source.post.feedContext,
        reqId: source.post.reqId,
      })
    }
  }

  const onPressShowMore = useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  const {isActive: live} = useActorStatus(post.author)

  const reason = source?.post.reason
  const viaRepost = useMemo(() => {
    if (AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid) {
      return {
        uri: reason.uri,
        cid: reason.cid,
      }
    }
  }, [reason])

  if (!record) {
    return <ErrorMessage message={_(msg`Invalid or unsupported post record`)} />
  }

  if (isHighlightedPost) {
    return (
      <>
        {rootUri !== post.uri && (
          <View
            style={[
              a.pl_lg,
              a.flex_row,
              a.pb_xs,
              {height: a.pt_lg.paddingTop},
            ]}>
            <View style={{width: 42}}>
              <View
                style={[
                  styles.replyLine,
                  a.flex_grow,
                  {backgroundColor: pal.colors.replyLine},
                ]}
              />
            </View>
          </View>
        )}

        <View
          testID={`postThreadItem-by-${post.author.handle}`}
          style={[
            a.px_lg,
            t.atoms.border_contrast_low,
            // root post styles
            rootUri === post.uri && [a.pt_lg],
          ]}>
          <View style={[a.flex_row, a.gap_md, a.pb_md]}>
            <PreviewableUserAvatar
              size={42}
              profile={post.author}
              moderation={moderation.ui('avatar')}
              type={post.author.associated?.labeler ? 'labeler' : 'user'}
              live={live}
              onBeforePress={onOpenAuthor}
            />
            <View style={[a.flex_1]}>
              <View style={[a.flex_row, a.align_center]}>
                <Link
                  style={[a.flex_shrink]}
                  href={authorHref}
                  title={authorTitle}
                  onBeforePress={onOpenAuthor}>
                  <Text
                    emoji
                    style={[
                      a.text_lg,
                      a.font_bold,
                      a.leading_snug,
                      a.self_start,
                    ]}
                    numberOfLines={1}>
                    {sanitizeDisplayName(
                      post.author.displayName ||
                        sanitizeHandle(post.author.handle),
                      moderation.ui('displayName'),
                    )}
                  </Text>
                </Link>

                <View style={[{paddingLeft: 3, top: -1}]}>
                  <VerificationCheckButton
                    profile={shadowedPostAuthor}
                    size="md"
                  />
                </View>
              </View>
              <Link style={s.flex1} href={authorHref} title={authorTitle}>
                <Text
                  emoji
                  style={[
                    a.text_md,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={1}>
                  {sanitizeHandle(post.author.handle, '@')}
                </Text>
              </Link>
            </View>
            {showFollowButton && (
              <View>
                <PostThreadFollowBtn did={post.author.did} />
              </View>
            )}
          </View>
          <View style={[a.pb_sm]}>
            <LabelsOnMyPost post={post} style={[a.pb_sm]} />
            <ContentHider
              modui={moderation.ui('contentView')}
              ignoreMute
              childContainerStyle={[a.pt_sm]}>
              <PostAlerts
                modui={moderation.ui('contentView')}
                size="lg"
                includeMute
                style={[a.pb_sm]}
                additionalCauses={additionalPostAlerts}
              />
              {richText?.text ? (
                <RichText
                  enableTags
                  selectable
                  value={richText}
                  style={[a.flex_1, a.text_xl]}
                  authorHandle={post.author.handle}
                  shouldProxyLinks={true}
                />
              ) : undefined}
              {post.embed && (
                <View style={[a.py_xs]}>
                  <PostEmbeds
                    embed={post.embed}
                    moderation={moderation}
                    viewContext={PostEmbedViewContext.ThreadHighlighted}
                    onOpen={onOpenEmbed}
                  />
                </View>
              )}
            </ContentHider>
            <ExpandedPostDetails
              post={post}
              isThreadAuthor={isThreadAuthor}
              translatorUrl={translatorUrl}
              needsTranslation={needsTranslation}
            />
            {post.repostCount !== 0 ||
            post.likeCount !== 0 ||
            post.quoteCount !== 0 ? (
              // Show this section unless we're *sure* it has no engagement.
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.gap_lg,
                  a.border_t,
                  a.border_b,
                  a.mt_md,
                  a.py_md,
                  t.atoms.border_contrast_low,
                ]}>
                {post.repostCount != null && post.repostCount !== 0 ? (
                  <Link href={repostsHref} title={repostsTitle}>
                    <Text
                      testID="repostCount-expanded"
                      style={[a.text_md, t.atoms.text_contrast_medium]}>
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {formatCount(i18n, post.repostCount)}
                      </Text>{' '}
                      <Plural
                        value={post.repostCount}
                        one="repost"
                        other="reposts"
                      />
                    </Text>
                  </Link>
                ) : null}
                {post.quoteCount != null &&
                post.quoteCount !== 0 &&
                !post.viewer?.embeddingDisabled ? (
                  <Link href={quotesHref} title={quotesTitle}>
                    <Text
                      testID="quoteCount-expanded"
                      style={[a.text_md, t.atoms.text_contrast_medium]}>
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {formatCount(i18n, post.quoteCount)}
                      </Text>{' '}
                      <Plural
                        value={post.quoteCount}
                        one="quote"
                        other="quotes"
                      />
                    </Text>
                  </Link>
                ) : null}
                {post.likeCount != null && post.likeCount !== 0 ? (
                  <Link href={likesHref} title={likesTitle}>
                    <Text
                      testID="likeCount-expanded"
                      style={[a.text_md, t.atoms.text_contrast_medium]}>
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {formatCount(i18n, post.likeCount)}
                      </Text>{' '}
                      <Plural value={post.likeCount} one="like" other="likes" />
                    </Text>
                  </Link>
                ) : null}
              </View>
            ) : null}
            <View
              style={[
                a.pt_sm,
                a.pb_2xs,
                {
                  marginLeft: -5,
                },
              ]}>
              <FeedFeedbackProvider value={feedFeedback}>
                <PostControls
                  big
                  post={post}
                  record={record}
                  richText={richText}
                  onPressReply={onPressReply}
                  onPostReply={onPostReply}
                  logContext="PostThreadItem"
                  threadgateRecord={threadgateRecord}
                  feedContext={source?.post?.feedContext}
                  reqId={source?.post?.reqId}
                  viaRepost={viaRepost}
                />
              </FeedFeedbackProvider>
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
          modui={moderation.ui('contentList')}
          iconSize={isThreadedChild ? 24 : 42}
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
            <View style={{width: 42}}>
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
              a.flex_row,
              a.px_sm,
              a.gap_md,
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
              <View>
                <PreviewableUserAvatar
                  size={42}
                  profile={post.author}
                  moderation={moderation.ui('avatar')}
                  type={post.author.associated?.labeler ? 'labeler' : 'user'}
                  live={live}
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

            <View style={[a.flex_1]}>
              <PostMeta
                author={post.author}
                moderation={moderation}
                timestamp={post.indexedAt}
                postHref={postHref}
                showAvatar={isThreadedChild}
                avatarSize={24}
                style={[a.pb_xs]}
              />
              <LabelsOnMyPost post={post} style={[a.pb_xs]} />
              <PostAlerts
                modui={moderation.ui('contentList')}
                style={[a.pb_2xs]}
                additionalCauses={additionalPostAlerts}
              />
              {richText?.text ? (
                <View style={[a.pb_2xs, a.pr_sm]}>
                  <RichText
                    enableTags
                    value={richText}
                    style={[a.flex_1, a.text_md]}
                    numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                    authorHandle={post.author.handle}
                    shouldProxyLinks={true}
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
                  <PostEmbeds
                    embed={post.embed}
                    moderation={moderation}
                    viewContext={PostEmbedViewContext.Feed}
                  />
                </View>
              )}
              <PostControls
                post={post}
                record={record}
                richText={richText}
                onPressReply={onPressReply}
                logContext="PostThreadItem"
                threadgateRecord={threadgateRecord}
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
              <Text
                style={[t.atoms.text_contrast_medium, a.font_bold, a.text_sm]}>
                <Trans>More</Trans>
              </Text>
              <ChevronRightIcon
                size="xs"
                style={[t.atoms.text_contrast_medium]}
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
  const t = useTheme()
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  if (treeView && depth > 0) {
    return (
      <View
        style={[
          a.flex_row,
          a.px_sm,
          a.flex_row,
          t.atoms.border_contrast_low,
          styles.cursor,
          depth === 1 && a.border_t,
        ]}
        onPointerEnter={onHoverIn}
        onPointerLeave={onHoverOut}>
        {Array.from(Array(depth - 1)).map((_, n: number) => (
          <View
            key={`${post.uri}-padding-${n}`}
            style={[
              a.ml_sm,
              t.atoms.border_contrast_low,
              {
                borderLeftWidth: 2,
                paddingLeft: a.pl_sm.paddingLeft - 2, // minus border
              },
            ]}
          />
        ))}
        <View style={a.flex_1}>
          <SubtleWebHover
            hover={hover}
            style={{
              left: (depth === 1 ? 0 : 2) - a.pl_sm.paddingLeft,
              right: -a.pr_sm.paddingRight,
            }}
          />
          {children}
        </View>
      </View>
    )
  }
  return (
    <View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      style={[
        a.border_t,
        a.px_sm,
        t.atoms.border_contrast_low,
        showParentReplyLine && hasPrecedingItem && styles.noTopBorder,
        hideTopBorder && styles.noTopBorder,
        styles.cursor,
      ]}>
      <SubtleWebHover hover={hover} />
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
  const t = useTheme()
  const pal = usePalette('default')
  const {_, i18n} = useLingui()
  const openLink = useOpenLink()
  const isRootPost = !('reply' in post.record)
  const langPrefs = useLanguagePrefs()

  const onTranslatePress = useCallback(
    (e: GestureResponderEvent) => {
      e.preventDefault()
      openLink(translatorUrl, true)

      if (
        bsky.dangerousIsType<AppBskyFeedPost.Record>(
          post.record,
          AppBskyFeedPost.isRecord,
        )
      ) {
        logger.metric('translate', {
          sourceLanguages: post.record.langs ?? [],
          targetLanguage: langPrefs.primaryLanguage,
          textLength: post.record.text.length,
        })
      }

      return false
    },
    [openLink, translatorUrl, langPrefs, post],
  )

  return (
    <View style={[a.gap_md, a.pt_md, a.align_start]}>
      <BackdatedPostIndicator post={post} />
      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {niceDate(i18n, post.indexedAt)}
        </Text>
        {isRootPost && (
          <WhoCanReply post={post} isThreadAuthor={isThreadAuthor} />
        )}
        {needsTranslation && (
          <>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              &middot;
            </Text>

            <InlineLinkText
              to={translatorUrl}
              label={_(msg`Translate`)}
              style={[a.text_sm, pal.link]}
              onPress={onTranslatePress}>
              <Trans>Translate</Trans>
            </InlineLinkText>
          </>
        )}
      </View>
    </View>
  )
}

function BackdatedPostIndicator({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const control = Prompt.usePromptControl()

  const indexedAt = new Date(post.indexedAt)
  const createdAt = bsky.dangerousIsType<AppBskyFeedPost.Record>(
    post.record,
    AppBskyFeedPost.isRecord,
  )
    ? new Date(post.record.createdAt)
    : new Date(post.indexedAt)

  // backdated if createdAt is 24 hours or more before indexedAt
  const isBackdated =
    indexedAt.getTime() - createdAt.getTime() > 24 * 60 * 60 * 1000

  if (!isBackdated) return null

  const orange = t.name === 'light' ? colors.warning.dark : colors.warning.light

  return (
    <>
      <Button
        label={_(msg`Archived post`)}
        accessibilityHint={_(
          msg`Shows information about when this post was created`,
        )}
        onPress={e => {
          e.preventDefault()
          e.stopPropagation()
          control.open()
        }}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.rounded_full,
              t.atoms.bg_contrast_25,
              (hovered || pressed) && t.atoms.bg_contrast_50,
              {
                gap: 3,
                paddingHorizontal: 6,
                paddingVertical: 3,
              },
            ]}>
            <CalendarClockIcon fill={orange} size="sm" aria-hidden />
            <Text
              style={[
                a.text_xs,
                a.font_bold,
                a.leading_tight,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Archived from {niceDate(i18n, createdAt)}</Trans>
            </Text>
          </View>
        )}
      </Button>

      <Prompt.Outer control={control}>
        <Prompt.TitleText>
          <Trans>Archived post</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            This post claims to have been created on{' '}
            <RNText style={[a.font_bold]}>{niceDate(i18n, createdAt)}</RNText>,
            but was first seen by Bluesky on{' '}
            <RNText style={[a.font_bold]}>{niceDate(i18n, indexedAt)}</RNText>.
          </Trans>
        </Prompt.DescriptionText>
        <Text
          style={[
            a.text_md,
            a.leading_snug,
            t.atoms.text_contrast_high,
            a.pb_xl,
          ]}>
          <Trans>
            Bluesky cannot confirm the authenticity of the claimed date.
          </Trans>
        </Text>
        <Prompt.Actions>
          <Prompt.Action cta={_(msg`Okay`)} onPress={() => {}} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingLeft: 8,
  },
  noTopBorder: {
    borderTopWidth: 0,
  },
  meta: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  metaExpandedLine1: {
    paddingVertical: 0,
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
