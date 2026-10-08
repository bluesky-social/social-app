import {type StyleProp, StyleSheet, type TextStyle, View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {formatCount} from '#/view/com/util/numeric/format'
import {PreviewableUserAvatar, UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {Card, getPostThumbnails} from './media'
import {SecondaryText} from './text'

/**
 * How many of the other actors' avatars `AvatarRow` shows before collapsing
 * the rest into a "+N" chip.
 */
const MAX_PREVIEW_AVATARS = 4

const PREVIEW_AVATAR_SIZE = 24

/**
 * Small avatars of the other actors in a grouped row, i.e. the "24 others" in
 * "**alice** and **24 others** liked your post". Sits above the primary
 * sentence and excludes the headline actor, who already has `Item.Avatar`.
 *
 * Shows up to four avatars, each linking to its profile, then a "+N" chip for
 * everyone else.
 */
export function AvatarRow({
  profiles,
  total,
  href,
}: {
  /**
   * The other actors, excluding the headline actor and without duplicates.
   * Usually only a resolved subset of `total`.
   */
  profiles: bsky.profile.AnyProfileView[]
  /**
   * How many other actors there are, including those without a resolved
   * profile. Use the notification's `count`, not `profiles.length`.
   */
  total: number
  /**
   * Where the "+N" chip goes, e.g. the post's liked-by list. Without it, the
   * chip isn't interactive and presses fall through to the row.
   */
  href?: string
}) {
  const moderationOpts = useModerationOpts()
  const shown = profiles.slice(0, MAX_PREVIEW_AVATARS)
  const remaining = total - shown.length

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      {shown.map(profile => (
        <PreviewableUserAvatar
          key={profile.did}
          size={PREVIEW_AVATAR_SIZE}
          profile={profile}
          moderation={
            moderationOpts
              ? moderateProfile(profile, moderationOpts).ui('avatar')
              : undefined
          }
          type={profile.associated?.labeler ? 'labeler' : 'user'}
        />
      ))}
      {remaining > 0 && <OverflowChip count={remaining} href={href} />}
    </View>
  )
}

/**
 * The "+N" at the end of an `AvatarRow`, sized to match the avatars.
 */
function OverflowChip({count, href}: {count: number; href?: string}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()

  const chip = (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_full,
        t.atoms.bg_contrast_50,
        t.atoms.border_contrast_low,
        {
          width: PREVIEW_AVATAR_SIZE,
          height: PREVIEW_AVATAR_SIZE,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      {/* Fixed size, since it has to fit inside the circle */}
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[a.font_medium, t.atoms.text_contrast_medium, {fontSize: 8}]}>
        {`+${formatCount(i18n, count)}`}
      </Text>
    </View>
  )

  if (!href) return chip

  return (
    <Link
      to={href}
      label={l`View everyone`}
      accessibilityHint={l`Opens the full list of accounts`}
      style={[a.rounded_full]}>
      {chip}
    </Link>
  )
}

/**
 * A short preview of a post's text, muted and ellipsized.
 *
 * Posts without text render nothing if they have images or video, since rows
 * show those as a trailing `Item.InlineImages`. Otherwise this says what the
 * post contains instead, e.g. "Link to nytimes.com".
 */
export function PostPreview({
  post,
  numberOfLines = 2,
  style,
}: {
  post: app.bsky.feed.defs.PostView
  numberOfLines?: number
  /**
   * Overrides the post text's style, e.g. its colour. The textless fallback
   * stays muted regardless.
   */
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const text = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record.text.trim()
    : ''

  if (text) {
    return (
      <SecondaryText numberOfLines={numberOfLines} style={style}>
        {text}
      </SecondaryText>
    )
  }

  if (getPostThumbnails(post.embed).length > 0) return null

  const embed = getTextlessEmbed(post.embed)
  if (!embed) return null

  let description: string
  if (embed.type === 'link') {
    const domain = embed.domain
    description = l`Link to ${domain}`
  } else {
    description = l({
      message: 'Quote post',
      comment:
        'Shown instead of the text of a post that only quotes another post',
      context: 'noun',
    })
  }

  return (
    <SecondaryText
      numberOfLines={1}
      style={[style, t.atoms.text_contrast_medium]}>
      {description}
    </SecondaryText>
  )
}

/**
 * What a post without text or media contains, for `PostPreview`'s fallback.
 */
function getTextlessEmbed(
  embed: app.bsky.feed.defs.PostView['embed'],
): {type: 'link'; domain: string} | {type: 'quote'} | undefined {
  const media = bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
    ? embed.media
    : embed

  if (bsky.isType(app.bsky.embed.external.view, media)) {
    return {type: 'link', domain: toNiceDomain(media.external.uri)}
  }
  if (
    bsky.isType(app.bsky.embed.record.view, embed) ||
    bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
  ) {
    return {type: 'quote'}
  }
  return undefined
}

/**
 * Compact, non-interactive card for a feed generator: its avatar, name, and
 * creator.
 */
export function FeedCard({
  generator,
}: {
  generator: app.bsky.feed.defs.GeneratorView
}) {
  const t = useTheme()
  const handle = sanitizeHandle(generator.creator.handle, '@')

  return (
    <Card>
      <View style={[a.flex_row, a.align_start, a.gap_sm]}>
        <UserAvatar
          type="algo"
          size={32}
          avatar={generator.avatar}
          extraAviStyle={{borderRadius: tokens.borderRadius.sm}}
        />
        <View style={[a.flex_1]}>
          <Text
            emoji
            numberOfLines={1}
            style={[a.text_sm, a.leading_snug, a.font_semi_bold]}>
            {generator.displayName}
          </Text>
          <Text
            emoji
            numberOfLines={1}
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>Feed by {handle}</Trans>
          </Text>
        </View>
      </View>
    </Card>
  )
}

/**
 * A "View all ->" link, for rows that summarise more than they can show.
 */
export function ViewAllLink({
  href,
  label,
}: {
  href: string
  /**
   * Accessibility label saying what "all" is, e.g. "View all posts liked by
   * alice".
   */
  label: string
}) {
  const t = useTheme()

  return (
    <Link to={href} label={label} style={[a.self_start, a.gap_xs]}>
      {({hovered}) => (
        <>
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              a.font_medium,
              {color: t.palette.primary_500},
              hovered && a.underline,
            ]}>
            <Trans>View all</Trans>
          </Text>
          <ArrowRightIcon size="xs" fill={t.palette.primary_500} />
        </>
      )}
    </Link>
  )
}
