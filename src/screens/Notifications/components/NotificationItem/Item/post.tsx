import {useState} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {moderatePost, type ModerationDecision} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Trans, useLingui} from '@lingui/react/macro'

import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {sanitizeHandle} from '#/lib/strings/handles'
import {countLines} from '#/lib/strings/helpers'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type ParentPost} from '#/state/queries/notifications/grouped/types'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRight} from '#/components/icons/Arrow'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Link, WebOnlyInlineLinkText} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls} from '#/components/PostControls'
import {ProfileBadges} from '#/components/ProfileBadges'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {makePostLink} from '../links'
import {Card, FeedCard, getPostThumbnails, InlineImages} from './media'
import {Strong, useDisplayName} from './text'

type PostView = app.bsky.feed.defs.PostView

/**
 * Post controls pad their top, and each button pads its hit area, which put
 * the icons well below the timestamp. Cancelling both leaves the icons the
 * row's usual gap below it. 5 is `PostControlButton`'s padding.
 */
const CONTROLS_STYLE = {paddingTop: 0, marginTop: -5}

/**
 * Collapses a post's text onto one line for single-line previews, so that
 * native ellipsis isn't cut short by a newline.
 */
function toOneLine(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Puts text on one line without changing its length, so rich text facets,
 * which are byte offsets, still line up.
 */
function flattenLines(text: string) {
  return text.replace(/[\r\n\t]/g, ' ')
}

/**
 * The author of a post-based notification on a single line, e.g. "**rafael**
 * @rafael.my". The name shrinks before the handle disappears entirely.
 */
export function Author({profile}: {profile: bsky.profile.AnyProfileView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const name = useDisplayName(profile)
  const href = makeProfileLink(profile)
  const label = l`Go to ${name}’s profile`

  return (
    <ProfileHoverCard did={profile.did}>
      <View style={[a.flex_row, a.align_center, a.self_start, a.max_w_full]}>
        <WebOnlyInlineLinkText
          emoji
          numberOfLines={1}
          to={href}
          label={label}
          disableMismatchWarning
          style={[
            a.flex_shrink,
            a.text_md,
            a.leading_snug,
            a.font_semi_bold,
            t.atoms.text,
            web({direction: 'ltr', unicodeBidi: 'isolate'}),
          ]}>
          {forceLTR(name)}
        </WebOnlyInlineLinkText>
        <ProfileBadges profile={profile} size="sm" style={[a.pl_2xs]} />
        <WebOnlyInlineLinkText
          emoji
          numberOfLines={1}
          to={href}
          label={label}
          disableMismatchWarning
          disableUnderline
          style={[
            a.text_md,
            a.leading_snug,
            t.atoms.text_contrast_medium,
            {flexShrink: 10},
          ]}>
          {NON_BREAKING_SPACE + sanitizeHandle(profile.handle, '@')}
        </WebOnlyInlineLinkText>
      </View>
    </ProfileHoverCard>
  )
}

/**
 * A single line of context under the author, with a small leading icon, e.g.
 * "replied to **you**: ...". Children are text spans, truncated with an
 * ellipsis.
 */
export function ContextLine({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<SVGIconProps>
  children: React.ReactNode
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <Icon size="xs" fill={t.atoms.text.color} style={[a.flex_shrink_0]} />
      <Text
        emoji
        numberOfLines={1}
        style={[a.flex_1, a.text_sm, a.leading_snug, t.atoms.text]}>
        {children}
      </Text>
    </View>
  )
}

/**
 * Which post a notification's post is responding to, e.g. "replied to **you**:
 * <your post>" or "replied to **bob**: <bob's post>".
 */
export function ReplyContext({
  parent,
  variant = 'reply',
}: {
  parent: ParentPost
  /**
   * `reply` for reply notifications ("replied to ..."). `inReply` for mentions
   * and quotes that happen to be replies ("in reply to ..."), where the headline
   * action is something else.
   */
  variant?: 'reply' | 'inReply'
}) {
  return (
    <ContextLine icon={ArrowCornerDownRight}>
      {parent.type === 'post' ? (
        <ReplyContextPost post={parent.post} variant={variant} />
      ) : (
        <Text>
          {parent.type === 'blocked' ? (
            variant === 'reply' ? (
              <Trans>replied to a blocked post</Trans>
            ) : (
              <Trans>in reply to a blocked post</Trans>
            )
          ) : variant === 'reply' ? (
            <Trans>replied to a deleted post</Trans>
          ) : (
            <Trans>in reply to a deleted post</Trans>
          )}
        </Text>
      )}
    </ContextLine>
  )
}

function ReplyContextPost({
  post,
  variant,
}: {
  post: PostView
  variant: 'reply' | 'inReply'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const name = forceLTR(useDisplayName(post.author))
  const isViewer = post.author.did === currentAccount?.did
  const subject = isViewer
    ? l({
        message: 'you',
        comment:
          'Emphasised in “replied to you: ...”, in a notification where someone replied to the viewer’s own post',
      })
    : name

  const isHidden = moderationOpts
    ? moderatePost(post, moderationOpts).ui('contentList').blur
    : false

  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined
  let preview = record ? toOneLine(record.text) : ''
  if (isHidden) {
    preview = l({
      message: 'Hidden post',
      comment:
        'Shown in place of the text of a post that is hidden by the viewer’s moderation settings',
    })
  } else if (!preview && post.embed) {
    preview = l({
      message: 'Post with media',
      comment:
        'Shown in place of the text of a post that has no text, only images, video, a link or a quoted post',
    })
  }
  // Nested text keeps its own size, so each part matches `ContextLine`'s
  const previewStyle = [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]
  const previewNode =
    record && preview && !isHidden ? (
      <RichText
        value={
          new RichTextAPI({
            text: flattenLines(record.text),
            facets: record.facets,
          })
        }
        authorHandle={post.author.handle}
        disableLinks
        // Text with only emoji is scaled up, which the one-line preview clips
        emojiMultiplier={1}
        style={previewStyle}
      />
    ) : (
      <Text emoji style={previewStyle}>
        {preview}
      </Text>
    )

  if (variant === 'reply') {
    return (
      <Trans>
        replied to <Strong style={a.text_sm}>{subject}</Strong>: {previewNode}
      </Trans>
    )
  }

  return (
    <Trans>
      in reply to <Strong style={a.text_sm}>{subject}</Strong>: {previewNode}
    </Trans>
  )
}

/**
 * A post's text and a compact preview of its embed, behind the usual
 * moderation hider. Images stand in for the text when there isn't any. Long
 * text is cut short with a "Show more" button, as in feeds.
 */
export function PostBody({post}: {post: PostView}) {
  const moderationOpts = useModerationOpts()
  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined
  const richText =
    record && record.text.trim()
      ? new RichTextAPI({text: record.text, facets: record.facets})
      : undefined
  /*
   * The same rule as posts in feeds: text with `MAX_POST_LINES` or more line
   * breaks stops at that many lines until the viewer asks for the rest. Only
   * line breaks count, not wrapping.
   */
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const moderation = moderationOpts
    ? moderatePost(post, moderationOpts)
    : undefined
  const embedPreview = post.embed ? getEmbedPreviewKind(post.embed) : undefined

  const onPressShowMore = (event: GestureResponderEvent) => {
    // Keep the press from reaching the row, which on web would follow its link
    event.preventDefault()
    event.stopPropagation()
    setLimitLines(false)
  }

  return (
    <ContentHider
      modui={moderation?.ui('contentView')}
      style={[a.gap_sm]}
      childContainerStyle={[a.gap_sm]}>
      {moderation && (
        <PostAlerts post={post} modui={moderation.ui('contentView')} />
      )}
      {richText && (
        // Keeps "Show more" right under the text, without the hider's gap
        <View>
          <RichText
            enableTags
            value={richText}
            authorHandle={post.author.handle}
            shouldProxyLinks
            numberOfLines={limitLines ? MAX_POST_LINES : undefined}
            // No colour here: it would override the links' and mentions'
            style={[a.text_md, a.leading_snug]}
          />
          {limitLines && (
            <ShowMoreTextButton style={[a.text_md]} onPress={onPressShowMore} />
          )}
        </View>
      )}
      {post.embed && embedPreview && (
        /*
         * The row stacks its lines 4px apart, but an embed gets 8px from
         * the header when there's no text, and media and links get 8px
         * before the timestamp too.
         */
        <View
          style={[!richText && a.mt_xs, embedPreview === 'media' && a.mb_xs]}>
          <EmbedPreview
            embed={post.embed}
            post={post}
            moderation={moderation}
          />
        </View>
      )}
    </ContentHider>
  )
}

/**
 * What `EmbedPreview` shows for an embed, by what it ends with: `media` for
 * thumbnails and links, `quote` for a quoted post or a shared feed (with or
 * without media above it), or undefined when it shows nothing.
 */
function getEmbedPreviewKind(
  embed: NonNullable<PostView['embed']>,
): 'media' | 'quote' | undefined {
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, embed)) {
    return hasRecordCard(embed.record)
      ? 'quote'
      : getEmbedPreviewKind(embed.media)
  }
  if (bsky.isType(app.bsky.embed.record.view, embed)) {
    return hasRecordCard(embed) ? 'quote' : undefined
  }
  if (bsky.isType(app.bsky.embed.external.view, embed)) {
    return 'media'
  }
  return getPostThumbnails(embed).length > 0 ? 'media' : undefined
}

/**
 * Whether `RecordPreview` renders anything for a record embed.
 */
function hasRecordCard(embed: app.bsky.embed.record.View) {
  switch (bsky.post.parseEmbedRecordView(embed).type) {
    case 'post':
    case 'post_blocked':
    case 'post_not_found':
    case 'post_detached':
    case 'feed':
      return true
    default:
      return false
  }
}

/**
 * The card for a record embed: a quoted post, or a feed that was shared.
 * Without it a post that shares a feed reads like a plain reply to whoever
 * made the feed. Other records, like lists, render nothing.
 */
function RecordPreview({embed}: {embed: app.bsky.embed.record.View}) {
  const parsed = bsky.post.parseEmbedRecordView(embed)

  if (parsed.type === 'feed') {
    return <FeedCard generator={parsed.view} />
  }
  return <QuoteCard embed={embed} />
}

/**
 * A compact stand-in for the full post embed: thumbnails for media, the
 * usual external embed for links, a card for quoted posts and shared feeds,
 * and nothing for lists and the like.
 */
function EmbedPreview({
  embed,
  post,
  moderation,
}: {
  embed: NonNullable<PostView['embed']>
  post: PostView
  /**
   * The post's own moderation, for its media. Quoted posts apply their own.
   */
  moderation: ModerationDecision | undefined
}) {
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, embed)) {
    return (
      <View style={[a.gap_sm]}>
        <EmbedPreview embed={embed.media} post={post} moderation={moderation} />
        <RecordPreview embed={embed.record} />
      </View>
    )
  }
  if (bsky.isType(app.bsky.embed.record.view, embed)) {
    return <RecordPreview embed={embed} />
  }
  if (bsky.isType(app.bsky.embed.external.view, embed)) {
    return (
      <ContentHider modui={moderation?.ui('contentMedia')}>
        <ExternalEmbed link={embed.external} post={post} />
      </ContentHider>
    )
  }
  return (
    <InlineImages
      embed={embed}
      size={80}
      blurred={moderation?.ui('contentMedia').blur ?? false}
    />
  )
}

/**
 * Compact preview of a quoted post: author, time and the start of its text.
 * Pressing it opens the quoted post. Blocked, deleted and detached quotes
 * collapse to a short muted line, and other record embeds render nothing.
 */
export function QuoteCard({
  embed,
  numberOfLines = 2,
  isMuted = false,
}: {
  embed: app.bsky.embed.record.View
  /**
   * How many lines of the quoted post's text to show.
   */
  numberOfLines?: number
  /**
   * Mutes the quoted post's text, as for a preview of the post.
   */
  isMuted?: boolean
}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const parsed = bsky.post.parseEmbedRecordView(embed)

  let placeholder: React.ReactNode = null
  switch (parsed.type) {
    case 'post':
      return (
        <QuoteCardPost
          view={parsed.view}
          numberOfLines={numberOfLines}
          isMuted={isMuted}
        />
      )
    case 'post_blocked':
      placeholder = <Trans>Blocked post</Trans>
      break
    case 'post_not_found':
      placeholder = <Trans>Deleted post</Trans>
      break
    case 'post_detached': {
      const isViewerOwner = currentAccount?.did
        ? parsed.view.uri.includes(currentAccount.did)
        : false
      placeholder = isViewerOwner ? (
        <Trans>Removed by you</Trans>
      ) : (
        <Trans>Removed by author</Trans>
      )
      break
    }
    default:
      return null
  }

  return (
    <Card>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        {placeholder}
      </Text>
    </Card>
  )
}

function QuoteCardPost({
  view,
  numberOfLines,
  isMuted,
}: {
  view: app.bsky.embed.record.ViewRecord
  numberOfLines: number
  isMuted: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const name = useDisplayName(view.author)
  const quote: PostView = {
    ...view,
    $type: 'app.bsky.feed.defs#postView',
    record: view.value,
    embed: view.embeds?.[0],
  }
  const moderation = moderationOpts
    ? moderatePost(quote, moderationOpts)
    : undefined
  const href = makePostLink(view)
  const quotedRecord = bsky.isType(app.bsky.feed.post, view.value)
    ? view.value
    : undefined

  return (
    <ContentHider modui={moderation?.ui('contentList')}>
      <Link
        to={href}
        label={l`Post by ${name}`}
        style={[a.flex_col, a.align_stretch, a.rounded_md]}>
        {({hovered, pressed}) => (
          <Card style={[a.gap_xs]}>
            <SubtleHover
              hover={hovered || pressed}
              native
              style={[a.rounded_md, a.curve_continuous]}
            />
            <View style={[a.flex_row, a.align_center, a.gap_xs, {height: 20}]}>
              <UserAvatar
                size={20}
                avatar={view.author.avatar}
                moderation={moderation?.ui('avatar')}
                type={view.author.associated?.labeler ? 'labeler' : 'user'}
              />
              <Text
                emoji
                numberOfLines={1}
                style={[
                  a.flex_shrink,
                  a.text_md,
                  a.leading_snug,
                  a.font_semi_bold,
                  t.atoms.text,
                ]}>
                {forceLTR(name)}
              </Text>
              <Text
                emoji
                numberOfLines={1}
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                  {flexShrink: 10},
                ]}>
                {sanitizeHandle(view.author.handle, '@')}
              </Text>
              <Text
                accessible={false}
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                &middot;
              </Text>
              <TimeElapsed timestamp={view.indexedAt}>
                {({timeElapsed}) => (
                  <Text
                    style={[
                      a.flex_shrink_0,
                      a.text_md,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {timeElapsed}
                  </Text>
                )}
              </TimeElapsed>
            </View>
            {quotedRecord?.text.trim() ? (
              <RichText
                value={
                  new RichTextAPI({
                    text: quotedRecord.text,
                    facets: quotedRecord.facets,
                  })
                }
                authorHandle={view.author.handle}
                // The whole card is already a link
                disableLinks
                numberOfLines={numberOfLines}
                style={[
                  a.text_md,
                  a.leading_snug,
                  isMuted ? t.atoms.text_contrast_medium : t.atoms.text,
                ]}
              />
            ) : (
              <InlineImages
                embed={quote.embed}
                size={60}
                blurred={moderation?.ui('contentMedia').blur ?? false}
              />
            )}
          </Card>
        )}
      </Link>
    </ContentHider>
  )
}

/**
 * The usual post controls for the notification's post, as a post in a feed
 * has them. Renders nothing once the post has been deleted.
 */
export function PostActions({post}: {post: PostView}) {
  const shadow = usePostShadow(post)

  if (shadow === POST_TOMBSTONE) return null
  if (!bsky.isType(app.bsky.feed.post, shadow.record)) return null

  return <PostActionsInner post={shadow} record={shadow.record} />
}

function PostActionsInner({
  post,
  record,
}: {
  post: Shadow<PostView>
  record: app.bsky.feed.post.Main
}) {
  const {openComposer} = useOpenComposer()
  const moderationOpts = useModerationOpts()
  const richText = new RichTextAPI({text: record.text, facets: record.facets})

  const onPressReply = () => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation: moderationOpts
          ? moderatePost(post, moderationOpts)
          : undefined,
        langs: record.langs,
      },
      logContext: 'PostReply',
    })
  }

  return (
    <PostControls
      post={post}
      record={record}
      richText={richText}
      onPressReply={onPressReply}
      logContext="Post"
      style={CONTROLS_STYLE}
    />
  )
}
