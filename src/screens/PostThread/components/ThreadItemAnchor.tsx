import {memo, useCallback, useMemo} from 'react'
import {type GestureResponderEvent, Text as RNText, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useActorStatus} from '#/lib/actor-status'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useTranslate} from '#/lib/hooks/useTranslate'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
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
import {type ThreadItem} from '#/state/queries/usePostThread/types'
import {useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {type PostSource} from '#/state/unstable-post-source'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {ThreadItemAnchorFollowButton} from '#/screens/PostThread/components/ThreadItemAnchorFollowButton'
import {
  LINEAR_AVI_WIDTH,
  OUTER_SPACE,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {colors} from '#/components/Admonition'
import {Button} from '#/components/Button'
import {DebugFieldDisplay} from '#/components/DebugFieldDisplay'
import {CalendarClock_Stroke2_Corner0_Rounded as CalendarClockIcon} from '#/components/icons/CalendarClock'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {InlineLinkText, Link} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {type AppModerationCause} from '#/components/Pills'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {PostControls, PostControlsSkeleton} from '#/components/PostControls'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import * as Skele from '#/components/Skeleton'
import {Text} from '#/components/Typography'
import {VerificationCheckButton} from '#/components/verification/VerificationCheckButton'
import {WhoCanReply} from '#/components/WhoCanReply'
import * as bsky from '#/types/bsky'

export function ThreadItemAnchor({
  item,
  onPostSuccess,
  threadgateRecord,
  postSource,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
  postSource?: PostSource
}) {
  const postShadow = usePostShadow(item.value.post)
  const threadRootUri = item.value.post.record.reply?.root?.uri || item.uri
  const isRoot = threadRootUri === item.uri

  if (postShadow === POST_TOMBSTONE) {
    return <ThreadItemAnchorDeleted isRoot={isRoot} />
  }

  return (
    <ThreadItemAnchorInner
      // Safeguard from clobbering per-post state below:
      key={postShadow.uri}
      item={item}
      isRoot={isRoot}
      postShadow={postShadow}
      onPostSuccess={onPostSuccess}
      threadgateRecord={threadgateRecord}
      postSource={postSource}
    />
  )
}

function ThreadItemAnchorDeleted({isRoot}: {isRoot: boolean}) {
  const t = useTheme()

  return (
    <>
      <ThreadItemAnchorParentReplyLine isRoot={isRoot} />

      <View
        style={[
          {
            paddingHorizontal: OUTER_SPACE,
            paddingBottom: OUTER_SPACE,
          },
          isRoot && [a.pt_lg],
        ]}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.py_md,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
          ]}>
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_center,
              {
                width: LINEAR_AVI_WIDTH,
              },
            ]}>
            <TrashIcon style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text
            style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium]}>
            <Trans>Post has been deleted</Trans>
          </Text>
        </View>
      </View>
    </>
  )
}

function ThreadItemAnchorParentReplyLine({isRoot}: {isRoot: boolean}) {
  const t = useTheme()

  return !isRoot ? (
    <View style={[a.pl_lg, a.flex_row, a.pb_xs, {height: a.pt_lg.paddingTop}]}>
      <View style={{width: 42}}>
        <View
          style={[
            {
              width: REPLY_LINE_WIDTH,
              marginLeft: 'auto',
              marginRight: 'auto',
              flexGrow: 1,
              backgroundColor: t.atoms.border_contrast_low.borderColor,
            },
          ]}
        />
      </View>
    </View>
  ) : null
}

const ThreadItemAnchorInner = memo(function ThreadItemAnchorInner({
  item,
  isRoot,
  postShadow,
  onPostSuccess,
  threadgateRecord,
  postSource,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  isRoot: boolean
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
  postSource?: PostSource
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {openComposer} = useOpenComposer()
  const {currentAccount, hasSession} = useSession()
  const feedFeedback = useFeedFeedback(postSource?.feedSourceInfo, hasSession)
  const formatPostStatCount = useFormatPostStatCount()

  const post = postShadow
  const record = item.value.post.record
  const moderation = item.moderation
  const authorShadow = useProfileShadow(post.author)
  const {isActive: live} = useActorStatus(post.author)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )

  const threadRootUri = record.reply?.root?.uri || post.uri
  const authorHref = makeProfileLink(post.author)
  const isThreadAuthor = getThreadAuthor(post, record) === currentAccount?.did

  const likesHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  }, [post.uri, post.author])
  const repostsHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by')
  }, [post.uri, post.author])
  const quotesHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'quotes')
  }, [post.uri, post.author])

  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
    const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri)
    const isControlledByViewer =
      new AtUri(threadRootUri).host === currentAccount?.did
    return isControlledByViewer && isPostHiddenByThreadgate
      ? [
          {
            type: 'reply-hidden',
            source: {type: 'user', did: currentAccount?.did},
            priority: 6,
          },
        ]
      : []
  }, [post, currentAccount?.did, threadgateHiddenReplies, threadRootUri])
  const onlyFollowersCanReply = !!threadgateRecord?.allow?.find(
    rule => rule.$type === 'app.bsky.feed.threadgate#followerRule',
  )
  const showFollowButton =
    currentAccount?.did !== post.author.did && !onlyFollowersCanReply

  const viaRepost = useMemo(() => {
    const reason = postSource?.post.reason

    if (AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid) {
      return {
        uri: reason.uri,
        cid: reason.cid,
      }
    }
  }, [postSource])

  const onPressReply = useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
        langs: record.langs,
      },
      onPostSuccess: onPostSuccess,
    })

    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionReply',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }, [
    openComposer,
    post,
    record,
    onPostSuccess,
    moderation,
    postSource,
    feedFeedback,
  ])

  const onOpenAuthor = () => {
    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughAuthor',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  const onOpenEmbed = () => {
    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughEmbed',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  return (
    <>
      <ThreadItemAnchorParentReplyLine isRoot={isRoot} />

      <View
        testID={`postThreadItem-by-${post.author.handle}`}
        style={[
          {
            paddingHorizontal: OUTER_SPACE,
          },
          isRoot && [a.pt_lg],
        ]}>
        <View style={[a.flex_row, a.gap_md, a.pb_md]}>
          <View collapsable={false}>
            <PreviewableUserAvatar
              size={42}
              profile={post.author}
              moderation={moderation.ui('avatar')}
              type={post.author.associated?.labeler ? 'labeler' : 'user'}
              live={live}
              onBeforePress={onOpenAuthor}
            />
          </View>
          <Link
            to={authorHref}
            style={[a.flex_1]}
            label={sanitizeDisplayName(
              post.author.displayName || sanitizeHandle(post.author.handle),
              moderation.ui('displayName'),
            )}
            onPress={onOpenAuthor}>
            <View style={[a.flex_1, a.align_start]}>
              <ProfileHoverCard did={post.author.did} style={[a.w_full]}>
                <View style={[a.flex_row, a.align_center]}>
                  <Text
                    emoji
                    style={[
                      a.flex_shrink,
                      a.text_lg,
                      a.font_semi_bold,
                      a.leading_snug,
                    ]}
                    numberOfLines={1}>
                    {sanitizeDisplayName(
                      post.author.displayName ||
                        sanitizeHandle(post.author.handle),
                      moderation.ui('displayName'),
                    )}
                  </Text>

                  <View style={[a.pl_xs]}>
                    <VerificationCheckButton profile={authorShadow} size="md" />
                  </View>
                </View>
                <Text
                  style={[
                    a.text_md,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={1}>
                  {sanitizeHandle(post.author.handle, '@')}
                </Text>
              </ProfileHoverCard>
            </View>
          </Link>
          {showFollowButton && (
            <View collapsable={false}>
              <ThreadItemAnchorFollowButton did={post.author.did} />
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
                style={[a.flex_1, a.text_lg]}
                authorHandle={post.author.handle}
                shouldProxyLinks={true}
              />
            ) : undefined}
            {post.embed && (
              <View style={[a.py_xs]}>
                <Embed
                  embed={post.embed}
                  moderation={moderation}
                  viewContext={PostEmbedViewContext.ThreadHighlighted}
                  onOpen={onOpenEmbed}
                />
              </View>
            )}
          </ContentHider>
          <ExpandedPostDetails
            post={item.value.post}
            isThreadAuthor={isThreadAuthor}
          />
          {post.repostCount !== 0 ||
          post.likeCount !== 0 ||
          post.quoteCount !== 0 ||
          post.bookmarkCount !== 0 ? (
            // Show this section unless we're *sure* it has no engagement.
            <View
              style={[
                a.flex_row,
                a.flex_wrap,
                a.align_center,
                {
                  rowGap: a.gap_sm.gap,
                  columnGap: a.gap_lg.gap,
                },
                a.border_t,
                a.border_b,
                a.mt_md,
                a.py_md,
                t.atoms.border_contrast_low,
              ]}>
              {post.repostCount != null && post.repostCount !== 0 ? (
                <Link to={repostsHref} label={_(msg`Reposts of this post`)}>
                  <Text
                    testID="repostCount-expanded"
                    style={[a.text_md, t.atoms.text_contrast_medium]}>
                    <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                      {formatPostStatCount(post.repostCount)}
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
                <Link to={quotesHref} label={_(msg`Quotes of this post`)}>
                  <Text
                    testID="quoteCount-expanded"
                    style={[a.text_md, t.atoms.text_contrast_medium]}>
                    <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                      {formatPostStatCount(post.quoteCount)}
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
                <Link to={likesHref} label={_(msg`Likes on this post`)}>
                  <Text
                    testID="likeCount-expanded"
                    style={[a.text_md, t.atoms.text_contrast_medium]}>
                    <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                      {formatPostStatCount(post.likeCount)}
                    </Text>{' '}
                    <Plural value={post.likeCount} one="like" other="likes" />
                  </Text>
                </Link>
              ) : null}
              {post.bookmarkCount != null && post.bookmarkCount !== 0 ? (
                <Text
                  testID="bookmarkCount-expanded"
                  style={[a.text_md, t.atoms.text_contrast_medium]}>
                  <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                    {formatPostStatCount(post.bookmarkCount)}
                  </Text>{' '}
                  <Plural value={post.bookmarkCount} one="save" other="saves" />
                </Text>
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
                post={postShadow}
                record={record}
                richText={richText}
                onPressReply={onPressReply}
                logContext="PostThreadItem"
                threadgateRecord={threadgateRecord}
                feedContext={postSource?.post?.feedContext}
                reqId={postSource?.post?.reqId}
                viaRepost={viaRepost}
              />
            </FeedFeedbackProvider>
          </View>
          <DebugFieldDisplay subject={post} />
        </View>
      </View>
    </>
  )
})

function ExpandedPostDetails({
  post,
  isThreadAuthor,
}: {
  post: Extract<ThreadItem, {type: 'threadPost'}>['value']['post']
  isThreadAuthor: boolean
}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const translate = useTranslate()
  const isRootPost = !('reply' in post.record)
  const langPrefs = useLanguagePrefs()

  const needsTranslation = useMemo(
    () =>
      Boolean(
        langPrefs.primaryLanguage &&
          !isPostInLanguage(post, [langPrefs.primaryLanguage]),
      ),
    [post, langPrefs.primaryLanguage],
  )

  const onTranslatePress = useCallback(
    (e: GestureResponderEvent) => {
      e.preventDefault()
      translate(post.record.text || '', langPrefs.primaryLanguage)

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
    [translate, langPrefs, post],
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
              // overridden to open an intent on android, but keep
              // as anchor tag for accessibility
              to={getTranslatorLink(
                post.record.text,
                langPrefs.primaryLanguage,
              )}
              label={_(msg`Translate`)}
              style={[a.text_sm]}
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

  const orange = colors.warning

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
                a.font_semi_bold,
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
            <RNText style={[a.font_semi_bold]}>
              {niceDate(i18n, createdAt)}
            </RNText>
            , but was first seen by Bluesky on{' '}
            <RNText style={[a.font_semi_bold]}>
              {niceDate(i18n, indexedAt)}
            </RNText>
            .
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

export function ThreadItemAnchorSkeleton() {
  return (
    <View style={[a.p_lg, a.gap_md]}>
      <Skele.Row style={[a.align_center, a.gap_md]}>
        <Skele.Circle size={42} />

        <Skele.Col>
          <Skele.Text style={[a.text_lg, {width: '20%'}]} />
          <Skele.Text blend style={[a.text_md, {width: '40%'}]} />
        </Skele.Col>
      </Skele.Row>

      <View>
        <Skele.Text style={[a.text_xl, {width: '100%'}]} />
        <Skele.Text style={[a.text_xl, {width: '60%'}]} />
      </View>

      <Skele.Text style={[a.text_sm, {width: '50%'}]} />

      <PostControlsSkeleton big />
    </View>
  )
}
