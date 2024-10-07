import React, {memo, useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {MAX_POST_LINES} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {countLines} from '#/lib/strings/helpers'
import {niceDate} from '#/lib/strings/time'
import {s} from '#/lib/styles'
import {POST_TOMBSTONE, Shadow, usePostShadow} from '#/state/cache/post-shadow'
import {useLanguagePrefs} from '#/state/preferences'
import {useOpenLink} from '#/state/preferences/in-app-browser'
import {ThreadPost} from '#/state/queries/post-thread'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {PostThreadFollowBtn} from '#/view/com/post-thread/PostThreadFollowBtn'
import {atoms as a, useTheme} from '#/alf'
import {AppModerationCause} from '#/components/Pills'
import {RichText} from '#/components/RichText'
import {Text as NewText} from '#/components/Typography'
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
import {PostEmbeds, PostEmbedViewContext} from '../util/post-embeds'
import {PostMeta} from '../util/PostMeta'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'

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
  const t = useTheme()
  const pal = usePalette('default')
  const {_, i18n} = useLingui()
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
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = React.useMemo(() => {
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
  const quotesHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'quotes')
  }, [post.uri, post.author])
  const quotesTitle = _(msg`Quotes of this post`)

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
            />
            <View style={[a.flex_1]}>
              <Link style={s.flex1} href={authorHref} title={authorTitle}>
                <NewText
                  emoji
                  style={[a.text_lg, a.font_bold, a.leading_snug, a.self_start]}
                  numberOfLines={1}>
                  {sanitizeDisplayName(
                    post.author.displayName ||
                      sanitizeHandle(post.author.handle),
                    moderation.ui('displayName'),
                  )}
                </NewText>
              </Link>
              <Link style={s.flex1} href={authorHref} title={authorTitle}>
                <NewText
                  emoji
                  style={[
                    a.text_md,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={1}>
                  {sanitizeHandle(post.author.handle, '@')}
                </NewText>
              </Link>
            </View>
            {currentAccount?.did !== post.author.did && (
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
                />
              ) : undefined}
              {post.embed && (
                <View style={[a.py_xs]}>
                  <PostEmbeds
                    embed={post.embed}
                    moderation={moderation}
                    viewContext={PostEmbedViewContext.ThreadHighlighted}
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
                    <NewText
                      testID="repostCount-expanded"
                      style={[a.text_md, t.atoms.text_contrast_medium]}>
                      <NewText style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {formatCount(i18n, post.repostCount)}
                      </NewText>{' '}
                      <Plural
                        value={post.repostCount}
                        one="repost"
                        other="reposts"
                      />
                    </NewText>
                  </Link>
                ) : null}
                {post.quoteCount != null &&
                post.quoteCount !== 0 &&
                !post.viewer?.embeddingDisabled ? (
                  <Link href={quotesHref} title={quotesTitle}>
                    <NewText
                      testID="quoteCount-expanded"
                      style={[a.text_md, t.atoms.text_contrast_medium]}>
                      <NewText style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {formatCount(i18n, post.quoteCount)}
                      </NewText>{' '}
                      <Plural
                        value={post.quoteCount}
                        one="quote"
                        other="quotes"
                      />
                    </NewText>
                  </Link>
                ) : null}
                {post.likeCount != null && post.likeCount !== 0 ? (
                  <Link href={likesHref} title={likesTitle}>
                    <NewText
                      testID="likeCount-expanded"
                      style={[a.text_md, t.atoms.text_contrast_medium]}>
                      <NewText style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {formatCount(i18n, post.likeCount)}
                      </NewText>{' '}
                      <Plural value={post.likeCount} one="like" other="likes" />
                    </NewText>
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
              <PostCtrls
                big
                post={post}
                record={record}
                richText={richText}
                onPressReply={onPressReply}
                onPostReply={onPostReply}
                logContext="PostThreadItem"
                threadgateRecord={threadgateRecord}
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
                avatarModeration={moderation.ui('avatar')}
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
              <PostCtrls
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
  const t = useTheme()
  if (treeView && depth > 0) {
    return (
      <View
        style={[
          a.flex_row,
          a.px_sm,
          t.atoms.border_contrast_low,
          styles.cursor,
          {
            flexDirection: 'row',
            borderTopWidth: depth === 1 ? a.border_t.borderTopWidth : 0,
          },
        ]}>
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
        <View style={{flex: 1}}>{children}</View>
      </View>
    )
  }
  return (
    <View
      style={[
        a.border_t,
        a.px_sm,
        t.atoms.border_contrast_low,
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
  const t = useTheme()
  const pal = usePalette('default')
  const {_, i18n} = useLingui()
  const openLink = useOpenLink()
  const isRootPost = !('reply' in post.record)

  const onTranslatePress = React.useCallback(() => {
    openLink(translatorUrl)
  }, [openLink, translatorUrl])

  return (
    <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm, a.pt_md]}>
      <NewText style={[a.text_sm, t.atoms.text_contrast_medium]}>
        {niceDate(i18n, post.indexedAt)}
      </NewText>
      {isRootPost && (
        <WhoCanReply post={post} isThreadAuthor={isThreadAuthor} />
      )}
      {needsTranslation && (
        <>
          <NewText style={[a.text_sm, t.atoms.text_contrast_medium]}>
            &middot;
          </NewText>

          <NewText
            style={[a.text_sm, pal.link]}
            title={_(msg`Translate`)}
            onPress={onTranslatePress}>
            <Trans>Translate</Trans>
          </NewText>
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
