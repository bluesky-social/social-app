import {useState} from 'react'
import {View} from 'react-native'
import {moderatePost, type ModerationDecision} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {makeProfileLink} from '#/lib/routes/links'
import {forceLTR} from '#/lib/strings/bidi'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {sanitizeHandle} from '#/lib/strings/handles'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type ParentPost} from '#/state/queries/notifications/grouped/types'
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {useRequireAuth, useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, select, useTheme, utils, web} from '#/alf'
import {Button} from '#/components/Button'
import {ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRight} from '#/components/icons/Arrow'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
  Heart2_Stroke2_Corner0_Rounded as Heart,
} from '#/components/icons/Heart2'
import {Reply_Stroke2_Corner0_Rounded as Bubble} from '#/components/icons/Reply'
import {Link, WebOnlyInlineLinkText} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import {PostMenuButton} from '#/components/PostControls/PostMenu'
import {ProfileBadges} from '#/components/ProfileBadges'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {makePostLink} from '../links'
import {Card, getPostThumbnails, InlineImages} from './media'
import {Strong, useDisplayName} from './text'

type PostView = app.bsky.feed.defs.PostView

/**
 * Light pink behind the "Liked" pill. There's no pink tint in the palette, so
 * the dark themes use a translucent pink instead.
 */
function useLikedBackground() {
  const t = useTheme()
  return select(t.name, {
    light: '#FFF3F9',
    dim: utils.alpha(t.palette.pink, 0.15),
    dark: utils.alpha(t.palette.pink, 0.15),
  })
}

/**
 * Keeps 24px pills comfortable to tap without overlapping their neighbours.
 */
const PILL_HITSLOP = {top: 10, bottom: 10, left: 2, right: 2}

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
            a.text_sm,
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
            a.text_sm,
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
 * "replied to: ...". Children are text spans, truncated with an ellipsis.
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
 * Which post a notification's post is responding to, e.g. "replied to: <your
 * post>" or "replied to **bob**: <bob's post>".
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
        style={previewStyle}
      />
    ) : (
      <Text emoji style={previewStyle}>
        {preview}
      </Text>
    )

  if (variant === 'reply') {
    return isViewer ? (
      <Trans>replied to: {previewNode}</Trans>
    ) : (
      <Trans>
        replied to <Strong>{name}</Strong>: {previewNode}
      </Trans>
    )
  }

  return isViewer ? (
    <Trans>in reply to: {previewNode}</Trans>
  ) : (
    <Trans>
      in reply to <Strong>{name}</Strong>: {previewNode}
    </Trans>
  )
}

/**
 * A post's text and a compact preview of its embed, behind the usual
 * moderation hider. Images stand in for the text when there isn't any.
 */
export function PostBody({post}: {post: PostView}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined
  const richText =
    record && record.text.trim()
      ? new RichTextAPI({text: record.text, facets: record.facets})
      : undefined
  const moderation = moderationOpts
    ? moderatePost(post, moderationOpts)
    : undefined
  const embedPreview = post.embed ? getEmbedPreviewKind(post.embed) : undefined

  return (
    <ContentHider
      modui={moderation?.ui('contentView')}
      style={[a.gap_sm]}
      childContainerStyle={[a.gap_sm]}>
      {moderation && (
        <PostAlerts post={post} modui={moderation.ui('contentView')} />
      )}
      {richText && (
        <RichText
          enableTags
          value={richText}
          authorHandle={post.author.handle}
          shouldProxyLinks
          style={[a.text_sm, a.leading_snug, t.atoms.text]}
        />
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
 * thumbnails and links, `quote` for a quoted post (with or without media
 * above it), or undefined when it shows nothing.
 */
function getEmbedPreviewKind(
  embed: NonNullable<PostView['embed']>,
): 'media' | 'quote' | undefined {
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, embed)) {
    return hasQuoteCard(embed.record)
      ? 'quote'
      : getEmbedPreviewKind(embed.media)
  }
  if (bsky.isType(app.bsky.embed.record.view, embed)) {
    return hasQuoteCard(embed) ? 'quote' : undefined
  }
  if (bsky.isType(app.bsky.embed.external.view, embed)) {
    return 'media'
  }
  return getPostThumbnails(embed).length > 0 ? 'media' : undefined
}

/**
 * Whether `QuoteCard` renders anything for a record embed.
 */
function hasQuoteCard(embed: app.bsky.embed.record.View) {
  switch (bsky.post.parseEmbedRecordView(embed).type) {
    case 'post':
    case 'post_blocked':
    case 'post_not_found':
    case 'post_detached':
      return true
    default:
      return false
  }
}

/**
 * A compact stand-in for the full post embed: thumbnails for media, the
 * usual external embed for links, a card for quoted posts, and nothing for
 * feeds, lists and the like.
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
        <QuoteCard embed={embed.record} />
      </View>
    )
  }
  if (bsky.isType(app.bsky.embed.record.view, embed)) {
    return <QuoteCard embed={embed} />
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
 * Compact preview of a quoted post: author, time and two lines of text.
 * Pressing it opens the quoted post. Blocked, deleted and detached quotes
 * collapse to a short muted line, and other record embeds render nothing.
 */
export function QuoteCard({embed}: {embed: app.bsky.embed.record.View}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const parsed = bsky.post.parseEmbedRecordView(embed)

  let placeholder: React.ReactNode = null
  switch (parsed.type) {
    case 'post':
      return <QuoteCardPost view={parsed.view} />
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
      <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
        {placeholder}
      </Text>
    </Card>
  )
}

function QuoteCardPost({view}: {view: app.bsky.embed.record.ViewRecord}) {
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
        {({hovered}) => (
          <Card style={[a.gap_xs, hovered && t.atoms.bg_contrast_25]}>
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
                  a.text_sm,
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
                  a.text_sm,
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
                      a.text_sm,
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
                numberOfLines={2}
                style={[a.text_sm, a.leading_snug, t.atoms.text]}
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
 * Like, reply and the post menu for the notification's post. The menu carries
 * the rest of the usual post controls: repost, quote, share and save. Renders
 * nothing once the post has been deleted.
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
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const haptics = useHaptics()
  const requireAuth = useRequireAuth()
  const {openComposer} = useOpenComposer()
  const moderationOpts = useModerationOpts()
  const likedBackground = useLikedBackground()
  const [queueLike, queueUnlike] = usePostLikeMutationQueue(
    post,
    undefined,
    undefined,
    'Post',
  )
  /*
   * There's no viewer state for "has replied", so this only reflects replies
   * sent from this row while it's mounted.
   */
  const [hasReplied, setHasReplied] = useState(false)

  const isLiked = Boolean(post.viewer?.like)
  const isBlocked = Boolean(
    post.author.viewer?.blocking ||
    post.author.viewer?.blockedBy ||
    post.author.viewer?.blockingByList,
  )
  const replyDisabled = Boolean(post.viewer?.replyDisabled)
  const richText = new RichTextAPI({text: record.text, facets: record.facets})

  const showBlockedToast = () => {
    Toast.show(l`Cannot interact with a blocked user`, {type: 'warning'})
  }

  const onToggleLike = async () => {
    if (isBlocked) {
      showBlockedToast()
      return
    }
    try {
      if (isLiked) {
        await queueUnlike()
      } else {
        await queueLike()
      }
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }

  const onPressReply = () => {
    if (isBlocked) {
      showBlockedToast()
      return
    }
    if (replyDisabled) return
    haptics.tap()
    requireAuth(() => {
      ax.metric('post:clickReply', {
        uri: post.uri,
        authorDid: post.author.did,
        logContext: 'Post',
      })
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
        onPost: () => setHasReplied(true),
        logContext: 'PostReply',
      })
    })
  }

  return (
    <View style={[a.flex_row, a.justify_between, a.align_center]}>
      <View style={[a.flex_row, a.gap_xs]}>
        <ActionPill
          testID="likeBtn"
          label={
            isLiked
              ? l({message: 'Unlike', comment: 'Verb, to remove a like'})
              : l({message: 'Like', comment: 'Verb, to like a post'})
          }
          icon={isLiked ? HeartFilled : Heart}
          color={isLiked ? t.palette.pink : undefined}
          backgroundColor={isLiked ? likedBackground : undefined}
          text={
            isLiked
              ? l({
                  message: 'Liked',
                  comment: 'Shown on the like button once the post is liked',
                })
              : l({message: 'Like', context: 'verb'})
          }
          onPress={() => {
            haptics.tap()
            requireAuth(() => onToggleLike())
          }}
        />
        <ActionPill
          testID="replyBtn"
          label={l({message: 'Reply', context: 'verb'})}
          icon={hasReplied ? Check : Bubble}
          dimmed={replyDisabled}
          text={
            hasReplied
              ? l({
                  message: 'Replied',
                  comment:
                    'Shown on the reply button after replying to the post',
                })
              : l({message: 'Reply', context: 'verb'})
          }
          onPress={onPressReply}
        />
      </View>
      {/*
       * The shared menu button is a 28px tall control with 5px of padding,
       * so pull it in to sit flush with the end of the row without making
       * the row taller than the pills.
       */}
      <View style={{marginVertical: -2, marginEnd: -5}}>
        <PostMenuButton
          testID="postDropdownBtn"
          post={post}
          postFeedContext={undefined}
          postReqId={undefined}
          record={record}
          richText={richText}
          timestamp={post.indexedAt}
          logContext="Post"
          forceGoogleTranslate={false}
          includeControls
        />
      </View>
    </View>
  )
}

/**
 * A small rounded action, e.g. "Like". Defaults to grey; pass `color` and
 * `backgroundColor` for an active state.
 */
function ActionPill({
  testID,
  label,
  icon: Icon,
  color,
  backgroundColor,
  text,
  dimmed = false,
  onPress,
}: {
  testID?: string
  /**
   * Accessibility label, which may differ from the visible text, e.g. "Unlike"
   * vs "Liked".
   */
  label: string
  icon: React.ComponentType<SVGIconProps>
  color?: string
  backgroundColor?: string
  text: string
  dimmed?: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const contentColor = color ?? t.atoms.text_contrast_high.color

  return (
    <Button
      testID={testID}
      label={label}
      onPress={onPress}
      hitSlop={PILL_HITSLOP}
      style={[
        a.gap_xs,
        a.rounded_full,
        backgroundColor ? {backgroundColor} : t.atoms.bg_contrast_50,
        {height: 24, paddingLeft: 9, paddingRight: 10},
        dimmed && {opacity: 0.6},
      ]}
      hoverStyle={backgroundColor ? undefined : t.atoms.bg_contrast_100}>
      <Icon size="xs" fill={contentColor} />
      <Text
        style={[
          a.text_xs,
          a.font_medium,
          a.user_select_none,
          {color: contentColor},
        ]}>
        {text}
      </Text>
    </Button>
  )
}
