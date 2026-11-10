import {useState} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {moderatePost} from '@bsky/sdk/moderation'
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
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRight} from '#/components/icons/Arrow'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {WebOnlyInlineLinkText} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {Embed} from '#/components/Post/Embed'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls} from '#/components/PostControls'
import {ProfileBadges} from '#/components/ProfileBadges'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
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
 * "replied to you: ...". Children are text spans, truncated with an
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
 * Which post a notification's post is responding to, e.g. "replied to you:
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
  /*
   * Who was replied to, when it isn't the viewer. The sentences name their
   * placeholder after this, so it stays `subject` to keep their translations
   */
  const subject = forceLTR(useDisplayName(post.author))
  const isViewer = post.author.did === currentAccount?.did

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

  /*
   * The viewer gets sentences of their own, rather than "you" filled in for
   * `subject`, since some languages word the rest differently for "you"
   */
  if (variant === 'reply') {
    return isViewer ? (
      <Trans comment="In a notification, someone replied to the viewer’s own post. Followed by a preview of that post">
        replied to you: {previewNode}
      </Trans>
    ) : (
      <Trans comment="In a notification, someone replied to another person’s post. {subject} is that person’s name, followed by a preview of their post">
        replied to <Strong style={a.text_sm}>{subject}</Strong>: {previewNode}
      </Trans>
    )
  }

  return isViewer ? (
    <Trans comment="In a notification about a mention or quote, the post is a reply to the viewer’s own post. Followed by a preview of that post">
      in reply to you: {previewNode}
    </Trans>
  ) : (
    <Trans comment="In a notification about a mention or quote, the post is a reply to another person’s post. {subject} is that person’s name, followed by a preview of their post">
      in reply to <Strong style={a.text_sm}>{subject}</Strong>: {previewNode}
    </Trans>
  )
}

/**
 * A post's text and its embed, behind the usual moderation hider. The embed
 * renders as it does in a feed. Long text is cut short with a "Show more"
 * button, as in feeds.
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
  const hasEmbed = post.embed ? rendersEmbed(post.embed) : false

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
      {hasEmbed && (
        /*
         * Embeds bring their own top margin, for the text above them in a
         * post, which the hider's gap already gives. Without text they sit
         * 8px from the header rather than the row's usual 4px, and they get
         * 4px more before the timestamp, as a feed post's embed does.
         */
        <View
          style={[
            a.mb_xs,
            {
              marginTop: richText
                ? -tokens.space.sm
                : -tokens.space.sm + tokens.space.xs,
            },
          ]}>
          <Embed embed={post.embed} moderation={moderation} post={post} />
        </View>
      )}
    </ContentHider>
  )
}

/**
 * Whether `Embed` renders anything for an embed. Labelers and unknown embeds
 * render nothing, so they shouldn't take up space in the row.
 */
function rendersEmbed(embed: NonNullable<PostView['embed']>) {
  const {type} = bsky.post.parseEmbed(embed)
  return type !== 'labeler' && type !== 'unknown'
}

/**
 * A record embed on its own, rendered by the same `Embed` that feeds use: a
 * quoted post (or its blocked, deleted or detached placeholder), or a shared
 * feed, list or starter pack. Labelers and unknown records render nothing.
 */
export function RecordCard({embed}: {embed: app.bsky.embed.record.View}) {
  const {type} = bsky.post.parseEmbedRecordView(embed)
  if (type === 'labeler' || type === 'unknown') return null

  return (
    /*
     * `Embed` gives records a top margin, for the post text above them, which
     * the row's own spacing already covers.
     */
    <View style={{marginTop: -tokens.space.sm}}>
      <Embed
        // Inside `recordWithMedia` the record view isn't typed
        embed={{...embed, $type: 'app.bsky.embed.record#view'}}
      />
    </View>
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
