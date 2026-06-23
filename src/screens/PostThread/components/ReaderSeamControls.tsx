import {Fragment, type ReactNode, useMemo} from 'react'
import {Text as RNText, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useQuery} from '@tanstack/react-query'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {makeProfileLink} from '#/lib/routes/links'
import {niceDate} from '#/lib/strings/time'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {sortAndAnnotateThreadItems} from '#/state/queries/usePostThread/traversal'
import {postThreadQueryKeyRoot} from '#/state/queries/usePostThread/types'
import {useAgent, useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {type PostSource} from '#/state/unstable-post-source'
import {ThreadComposePromptPill} from '#/screens/PostThread/components/ThreadComposePrompt'
import {
  ThreadItemPost,
  ThreadItemPostSkeleton,
} from '#/screens/PostThread/components/ThreadItemPost'
import {ThreadItemReadMore} from '#/screens/PostThread/components/ThreadItemReadMore'
import {
  OUTER_SPACE,
  READER_BRACKET_WIDTH,
  READER_LINE_INDENT,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {type ThreadPostItem} from '#/screens/PostThread/reader'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {CalendarClock_Stroke2_Corner0_Rounded as CalendarClockIcon} from '#/components/icons/CalendarClock'
import {Link} from '#/components/Link'
import {PostControls} from '#/components/PostControls'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {PostEditedIndicator} from '#/components/PostEditedIndicator'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {WhoCanReply} from '#/components/WhoCanReply'
import * as bsky from '#/types/bsky'

/**
 * The bracket drawn in a reader segment's gutter, spanning the post content
 * plus any expanded details and replies. `left` positions it relative to the
 * consumer's container, since the anchor renders inside padded content while
 * segments render full bleed. `bottom` lets the consumer raise the bottom cap
 * to line up with the seam's interaction row.
 */
export function ReaderBracket({
  left,
  bottom = READER_LINE_INDENT,
}: {
  left: number
  bottom?: number
}) {
  const t = useTheme()

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top: 0,
        bottom,
        width: OUTER_SPACE - READER_LINE_INDENT,
        borderLeftWidth: READER_BRACKET_WIDTH,
        borderTopWidth: READER_BRACKET_WIDTH,
        borderBottomWidth: READER_BRACKET_WIDTH,
        borderColor: t.atoms.border_contrast_low.borderColor,
      }}
    />
  )
}

/**
 * The details, stats, and interaction rows below a post's content. Shown for
 * the anchor post in every view, and revealed by the seam for reader
 * segments.
 */
export function ReaderSeamControls({
  post: postItem,
  postSource,
  showComposePrompt = false,
  showDetails = true,
  onPostSuccess,
  threadgateRecord,
}: {
  post: ThreadPostItem
  postSource?: PostSource
  showComposePrompt?: boolean
  /**
   * Whether to show the full date and engagement-count rows above the action
   * bar. Expanded reader segments set false: their PostMeta header shows the
   * timestamp, and the action bar's own counts cover the stats.
   */
  showDetails?: boolean
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const postShadow = usePostShadow(postItem.value.post)

  if (postShadow === POST_TOMBSTONE) {
    return null
  }

  return (
    <ReaderSeamControlsInner
      post={postItem}
      postShadow={postShadow}
      postSource={postSource}
      showComposePrompt={showComposePrompt}
      showDetails={showDetails}
      onPostSuccess={onPostSuccess}
      threadgateRecord={threadgateRecord}
    />
  )
}

function ReaderSeamControlsInner({
  post: postItem,
  postShadow,
  postSource,
  showComposePrompt,
  showDetails,
  onPostSuccess,
  threadgateRecord,
}: {
  post: ThreadPostItem
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  postSource?: PostSource
  showComposePrompt?: boolean
  showDetails?: boolean
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const {openComposer} = useOpenComposer()
  const formatPostStatCount = useFormatPostStatCount()
  const feedFeedback = useFeedFeedback(postSource?.feedSourceInfo, hasSession)

  const post = postShadow
  const record = postItem.value.post.record
  const moderation = postItem.moderation
  const isRootPost = !record.reply
  const isThreadAuthor = post.author.did === currentAccount?.did

  const richText = useMemo(
    () => new RichTextAPI({text: record.text, facets: record.facets}),
    [record],
  )

  const urip = new AtUri(post.uri)
  const likesHref = makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  const repostsHref = makeProfileLink(
    post.author,
    'post',
    urip.rkey,
    'reposted-by',
  )
  const quotesHref = makeProfileLink(post.author, 'post', urip.rkey, 'quotes')

  const reason = postSource?.post.reason
  const viaRepost =
    AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid
      ? {uri: reason.uri, cid: reason.cid}
      : undefined

  const onPressReply = () => {
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
      logContext: 'PostReply',
    })

    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionReply',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  const hasEngagement =
    post.repostCount || post.likeCount || post.quoteCount || post.bookmarkCount

  return (
    <View style={[a.gap_xs, a.pt_xs]}>
      {showDetails && <BackdatedPostIndicator post={post} />}

      {showDetails && (
        <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {niceDate(i18n, post.indexedAt, 'dot separated')}
          </Text>
          <PostEditedIndicator record={record} size="sm" />
          {isRootPost && (
            <WhoCanReply post={post} isThreadAuthor={isThreadAuthor} />
          )}
        </View>
      )}

      {/* Engagement counts */}
      {showDetails && hasEngagement ? (
        <View
          style={[
            a.flex_row,
            a.flex_wrap,
            a.align_center,
            {rowGap: a.gap_sm.gap, columnGap: a.gap_lg.gap},
            a.border_t,
            a.border_b,
            a.py_md,
            t.atoms.border_contrast_low,
          ]}>
          {post.repostCount ? (
            <Link to={repostsHref} label={l`Reposts of this post`}>
              <Text
                testID="repostCount-expanded"
                style={[a.text_md, t.atoms.text_contrast_medium]}>
                <Trans comment="Repost count display, the <0> tags enclose the number of reposts in bold (will never be 0)">
                  <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                    {formatPostStatCount(post.repostCount)}
                  </Text>{' '}
                  <Plural
                    value={post.repostCount}
                    one="repost"
                    other="reposts"
                  />
                </Trans>
              </Text>
            </Link>
          ) : null}
          {post.quoteCount && !post.viewer?.embeddingDisabled ? (
            <Link to={quotesHref} label={l`Quotes of this post`}>
              <Text
                testID="quoteCount-expanded"
                style={[a.text_md, t.atoms.text_contrast_medium]}>
                <Trans comment="Quote count display, the <0> tags enclose the number of quotes in bold (will never be 0)">
                  <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                    {formatPostStatCount(post.quoteCount)}
                  </Text>{' '}
                  <Plural value={post.quoteCount} one="quote" other="quotes" />
                </Trans>
              </Text>
            </Link>
          ) : null}
          {post.likeCount ? (
            <Link to={likesHref} label={l`Likes on this post`}>
              <Text
                testID="likeCount-expanded"
                style={[a.text_md, t.atoms.text_contrast_medium]}>
                <Trans comment="Like count display, the <0> tags enclose the number of likes in bold (will never be 0)">
                  <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                    {formatPostStatCount(post.likeCount)}
                  </Text>{' '}
                  <Plural value={post.likeCount} one="like" other="likes" />
                </Trans>
              </Text>
            </Link>
          ) : null}
          {post.bookmarkCount ? (
            <Text
              testID="bookmarkCount-expanded"
              style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans comment="Save count display, the <0> tags enclose the number of saves in bold (will never be 0)">
                <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                  {formatPostStatCount(post.bookmarkCount)}
                </Text>{' '}
                <Plural value={post.bookmarkCount} one="save" other="saves" />
              </Trans>
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Action bar + optional compose prompt as one gap item */}
      <View>
        <View style={[a.py_xs, {marginLeft: -5}]}>
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
        {showComposePrompt && (
          <View
            style={[
              a.border_t,
              a.border_b,
              a.py_xs,
              t.atoms.border_contrast_low,
              // Separators run from the bracket's vertical line to the edge
              {
                marginLeft: READER_LINE_INDENT - OUTER_SPACE,
                marginRight: -OUTER_SPACE,
              },
            ]}>
            {/* Hold the pill at the post's content edges */}
            <View
              style={[
                {
                  paddingLeft: OUTER_SPACE - READER_LINE_INDENT,
                  paddingRight: OUTER_SPACE,
                },
              ]}>
              <ThreadComposePromptPill onPress={onPressReply} />
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

function BackdatedPostIndicator({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
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

  return (
    <>
      <Button
        label={l`Archived post`}
        accessibilityHint={l`Shows information about when this post was created`}
        style={[a.self_start]}
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
            <CalendarClockIcon fill={t.palette.yellow} size="sm" aria-hidden />
            <Text
              style={[
                a.text_xs,
                a.font_semi_bold,
                a.leading_tight,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Archived from {niceDate(i18n, createdAt, 'medium')}</Trans>
            </Text>
          </View>
        )}
      </Button>

      <Prompt.Outer control={control}>
        <Prompt.Content>
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
          <Prompt.DescriptionText>
            <Trans>
              Bluesky cannot confirm the authenticity of the claimed date.
            </Trans>
          </Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action cta={l`Okay`} onPress={() => {}} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}

/**
 * Replies to a post, fetched when its seam is expanded, closed by a
 * horizontal rule at the bracket edge. The next post in the OP chain is
 * excluded since it renders as the following segment.
 */
export function ReaderSeamReplies({
  uri,
  continuationUri,
  hiddenReplyCount,
  href,
  sort,
  onPostSuccess,
  threadgateRecord,
}: {
  uri: string
  continuationUri: string
  hiddenReplyCount: number
  href: string
  sort: string
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })

  const {data, isError} = useQuery({
    enabled: !!moderationOpts,
    queryKey: [
      postThreadQueryKeyRoot,
      'readerSeamReplies',
      {anchor: uri, sort},
    ],
    async queryFn() {
      const {data: res} = await agent.app.bsky.unspecced.getPostThreadV2({
        anchor: uri,
        below: 1,
        sort,
      })
      /*
       * Everything under the `post-thread-v2` query key root gets scanned by
       * the post shadow cache integration, which expects a `{thread}` shape.
       */
      return {thread: res.thread || []}
    },
  })

  const replyItems = useMemo(() => {
    if (!data || !moderationOpts) return []
    const {threadItems} = sortAndAnnotateThreadItems(data.thread, {
      view: 'linear',
      skipModerationHandling: true,
      threadgateHiddenReplies,
      moderationOpts,
    })
    return threadItems
      .filter(reply => {
        if (reply.type === 'threadPost') {
          return reply.depth > 0 && reply.uri !== continuationUri
        }
        if (reply.type === 'readMore') {
          return reply.key !== `readMore:${continuationUri}`
        }
        return false
      })
      .map(reply => {
        if (reply.type === 'threadPost' && reply.ui.showParentReplyLine) {
          /*
           * The post these replies belong to renders above the seam, not
           * directly above the reply, so drop the connecting line. This also
           * gives each reply its separating top border.
           */
          return {...reply, ui: {...reply.ui, showParentReplyLine: false}}
        }
        return reply
      })
  }, [data, moderationOpts, threadgateHiddenReplies, continuationUri])

  let body: ReactNode
  if (isError) {
    /*
     * These replies are supplementary, so on error just link out to the post
     * where they can be read.
     */
    body = (
      <View style={[{paddingHorizontal: OUTER_SPACE}, a.pb_sm]}>
        <Link label={l`View replies`} to={href} style={[a.gap_xs]}>
          <Text style={[a.text_sm, a.underline]}>
            <Plural
              value={hiddenReplyCount}
              one="View # reply"
              other="View # replies"
            />
          </Text>
        </Link>
      </View>
    )
  } else if (!data || !moderationOpts) {
    body = <ThreadItemPostSkeleton index={0} />
  } else {
    body = replyItems.map((reply, index) => {
      if (reply.type === 'threadPost') {
        return (
          <Fragment key={reply.key}>
            {/* Inset separator starting at the bracket edge, in place of
                the post's own full-bleed top border */}
            {index > 0 && !reply.ui.showParentReplyLine && (
              <View
                style={[
                  a.border_t,
                  t.atoms.border_contrast_low,
                  {marginLeft: READER_LINE_INDENT},
                ]}
              />
            )}
            <ThreadItemPost
              item={reply}
              overrides={{topBorder: true}}
              hoverStyle={{left: READER_LINE_INDENT}}
              threadgateRecord={threadgateRecord}
              onPostSuccess={onPostSuccess}
            />
          </Fragment>
        )
      } else if (reply.type === 'readMore') {
        return <ThreadItemReadMore key={reply.key} item={reply} view="linear" />
      }
      return null
    })
  }

  return (
    <>
      {body}
      <View
        style={{
          height: REPLY_LINE_WIDTH,
          marginLeft: READER_LINE_INDENT,
          backgroundColor: t.atoms.border_contrast_low.borderColor,
        }}
      />
    </>
  )
}
