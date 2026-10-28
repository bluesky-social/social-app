import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {StarterPackMultiPathLarge as StarterPackIcon} from '#/components/icons/brands/StarterPack'
import {VerifiedCheck} from '#/components/icons/brands/VerifiedCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Contacts_Filled_Corner2_Rounded as ContactsIcon} from '#/components/icons/Contacts'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner3_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Skele from '#/components/Skeleton'
import type * as bsky from '#/types/bsky'
import {
  CLASSIC_AVATAR_GAP,
  CLASSIC_AVATAR_INSET,
  CLASSIC_AVATAR_SIZE,
  CLASSIC_LEAD_WIDTH,
  useIsClassicLayout,
} from './layout'
import {useItemBackgroundColor} from './Root'

/**
 * The colour family of a notification's icon badge.
 */
export type BadgeTone =
  'like' | 'repost' | 'follow' | 'conversation' | 'activity' | 'neutral'

/**
 * The v1-style icon that stands in for the avatar in the classic layout.
 */
export type ClassicGlyph =
  | 'like'
  | 'repost'
  | 'follow'
  | 'verified'
  | 'unverified'
  | 'starterPack'
  | 'contacts'

/**
 * Activity (subscribed post) badges use an orange that isn't in the ALF
 * palette yet.
 */
const ACTIVITY_ORANGE = '#F26022'

/**
 * Reply, quote and mention badges use a purple that isn't in the ALF palette
 * yet, which sets them apart from repost green and follow blue.
 */
const CONVERSATION_PURPLE = '#8679FC'

/**
 * The size of `Item.Avatar`'s avatar, for anything that stands in for it.
 */
export const AVATAR_SIZE = 44
const BADGE_SIZE = 24
/**
 * Between the icon sizes, so the icon keeps its share of the badge.
 */
const BADGE_ICON_SIZE = 14
/**
 * The width of the ring around the badge, in the row's background colour,
 * which sets it apart from the avatar.
 */
const BADGE_RING = 2

/**
 * The space the avatar sits in, with room for the badge to overlap its
 * bottom-end corner.
 */
const SLOT_SIZE = {
  width: AVATAR_SIZE + 6 + BADGE_RING,
  height: AVATAR_SIZE + 4 + BADGE_RING,
}

/**
 * How wide `Item.Avatar` is, for lining things up with the content column
 * beside it.
 */
export const AVATAR_SLOT_WIDTH = SLOT_SIZE.width

/**
 * The leading element of a row. By default it is the primary actor's avatar,
 * with an icon badge overlapping its bottom-end corner that says what kind of
 * notification this is. Omit `icon` for an unbadged avatar.
 *
 * In the classic layout, a badge for a like, repost, follow or similar turns
 * into a v1-style icon, right-aligned in the left column where the avatar
 * would be, and the row shows its people in `Item.AvatarRow` instead. Replies,
 * quotes, mentions and activity keep their avatar and badge, and so does an
 * avatar without a badge. `glyph` says which icon, and defaults from `tone`
 * for likes, reposts and follows.
 */
export function Avatar(props: {
  profile: bsky.profile.AnyProfileView
  icon?: React.ComponentType<SVGIconProps>
  tone?: BadgeTone
  glyph?: ClassicGlyph
}) {
  const isClassic = useIsClassicLayout()
  if (!isClassic) return <DefaultAvatar {...props} />

  const glyph = getClassicGlyph(props)
  return glyph ? (
    <ClassicGlyphColumn glyph={glyph} />
  ) : (
    <ClassicAvatar {...props} />
  )
}

/**
 * Which icon the classic layout shows for an avatar, if it shows one.
 */
function getClassicGlyph({
  icon,
  tone = 'follow',
  glyph,
}: {
  icon?: React.ComponentType<SVGIconProps>
  tone?: BadgeTone
  glyph?: ClassicGlyph
}): ClassicGlyph | undefined {
  if (glyph) return glyph
  if (!icon) return undefined
  switch (tone) {
    case 'like':
    case 'repost':
    case 'follow':
      return tone
    default:
      return undefined
  }
}

function DefaultAvatar({
  profile,
  icon: Icon,
  tone = 'follow',
}: {
  profile: bsky.profile.AnyProfileView
  icon?: React.ComponentType<SVGIconProps>
  tone?: BadgeTone
}) {
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined

  return (
    <View
      style={[
        SLOT_SIZE,
        // Without a badge, the avatar sits vertically centred in its slot
        !Icon && a.justify_center,
      ]}>
      <PreviewableUserAvatar
        size={AVATAR_SIZE}
        profile={profile}
        moderation={moderation?.ui('avatar')}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
        // It would cover the badge. The red ring still says they're live
        hideLiveBadge
      />
      {Icon && <Badge icon={Icon} tone={tone} style={{end: 0, bottom: 0}} />}
    </View>
  )
}

/**
 * The icon badge on an avatar. The ring around it is a padded circle behind
 * it rather than a border on it. A view's background is drawn under its border
 * too, so it would show through the anti-aliased edge of the ring.
 */
function Badge({
  icon: Icon,
  tone,
  style,
}: {
  icon: React.ComponentType<SVGIconProps>
  tone: BadgeTone
  /**
   * Where the badge sits, as `end` and `bottom` offsets.
   */
  style: {end: number; bottom: number}
}) {
  const t = useTheme()
  const ringColor = useItemBackgroundColor()

  const badgeColor = {
    like: t.palette.pink,
    repost: t.palette.positive_500,
    follow: t.palette.primary_500,
    conversation: CONVERSATION_PURPLE,
    activity: ACTIVITY_ORANGE,
    neutral: t.palette.contrast_500,
  }[tone]

  return (
    <View
      style={[
        a.absolute,
        a.rounded_full,
        {padding: BADGE_RING, backgroundColor: ringColor},
        style,
      ]}>
      <View
        style={[
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            backgroundColor: badgeColor,
          },
        ]}>
        <Icon width={BADGE_ICON_SIZE} fill={t.palette.white} />
      </View>
    </View>
  )
}

/**
 * How far the badge overlaps past the avatar's bottom-end corner in the
 * classic layout, which keeps it clear of the text beside it.
 */
const CLASSIC_BADGE_OVERHANG = 4

/**
 * The classic layout's avatar: in the left column of a post in a feed, so
 * that it lines up with the avatars of the posts around it.
 */
function ClassicAvatar({
  profile,
  icon: Icon,
  tone = 'follow',
}: {
  profile: bsky.profile.AnyProfileView
  icon?: React.ComponentType<SVGIconProps>
  tone?: BadgeTone
}) {
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined

  return (
    <View
      style={[
        // So the avatar's link wraps the avatar rather than the whole column
        a.align_start,
        {
          width: CLASSIC_LEAD_WIDTH,
          paddingLeft: CLASSIC_AVATAR_INSET,
          height: CLASSIC_AVATAR_SIZE + (Icon ? CLASSIC_BADGE_OVERHANG : 0),
        },
      ]}>
      <PreviewableUserAvatar
        size={CLASSIC_AVATAR_SIZE}
        profile={profile}
        moderation={moderation?.ui('avatar')}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
        // It would cover the badge. The red ring still says they're live
        hideLiveBadge
      />
      {Icon && (
        <Badge
          icon={Icon}
          tone={tone}
          style={{
            end: CLASSIC_AVATAR_GAP - CLASSIC_BADGE_OVERHANG,
            bottom: 0,
          }}
        />
      )}
    </View>
  )
}

/**
 * The classic layout's left column for a like, repost, follow and the like:
 * a v1-style icon, right-aligned to where a post's avatar ends.
 */
function ClassicGlyphColumn({glyph}: {glyph: ClassicGlyph}) {
  return (
    <View
      style={[
        a.align_end,
        {width: CLASSIC_LEAD_WIDTH, paddingRight: CLASSIC_AVATAR_GAP},
      ]}>
      <ClassicGlyphIcon glyph={glyph} />
    </View>
  )
}

function ClassicGlyphIcon({glyph}: {glyph: ClassicGlyph}) {
  const t = useTheme()

  switch (glyph) {
    case 'like':
      return <HeartIcon size="xl" fill={t.palette.pink} />
    case 'repost':
      return <RepostIcon size="xl" fill={t.palette.positive_500} />
    case 'follow':
      return <PersonPlusIcon size="xl" fill={t.palette.primary_500} />
    case 'verified':
      return <VerifiedCheck size="xl" />
    case 'unverified':
      return <VerifiedCheck size="xl" fill={t.palette.contrast_500} />
    case 'starterPack':
      return <StarterPackIcon width={30} gradient="sky" />
    case 'contacts':
      return <ContactsIcon size="xl" fill={t.palette.primary_500} />
  }
}

/**
 * Stands in for a badged `Avatar` while the row loads, in the same slot, with
 * a faint circle where the badge goes. In the classic layout, `variant="icon"`
 * stands in for the icon that a like, repost or follow has instead, and
 * `variant="plain"` for an avatar without a badge.
 */
export function AvatarSkeleton({
  variant = 'avatar',
}: {
  variant?: 'avatar' | 'icon' | 'plain'
}) {
  const isClassic = useIsClassicLayout()
  if (!isClassic) return <DefaultAvatarSkeleton />
  if (variant === 'icon') {
    return (
      <View
        style={[
          a.align_end,
          {width: CLASSIC_LEAD_WIDTH, paddingRight: CLASSIC_AVATAR_GAP},
        ]}>
        <Skele.Circle size={28} />
      </View>
    )
  }
  return <ClassicAvatarSkeleton isBadged={variant === 'avatar'} />
}

function ClassicAvatarSkeleton({isBadged}: {isBadged: boolean}) {
  const ringColor = useItemBackgroundColor()

  return (
    <View
      style={{
        width: CLASSIC_LEAD_WIDTH,
        paddingLeft: CLASSIC_AVATAR_INSET,
        height: CLASSIC_AVATAR_SIZE + (isBadged ? CLASSIC_BADGE_OVERHANG : 0),
      }}>
      <Skele.Circle size={CLASSIC_AVATAR_SIZE} />
      {isBadged && (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {
              end: CLASSIC_AVATAR_GAP - CLASSIC_BADGE_OVERHANG,
              bottom: 0,
              padding: BADGE_RING,
              backgroundColor: ringColor,
            },
          ]}>
          <Skele.Circle blend size={BADGE_SIZE} />
        </View>
      )}
    </View>
  )
}

function DefaultAvatarSkeleton() {
  const ringColor = useItemBackgroundColor()

  return (
    <View style={SLOT_SIZE}>
      <Skele.Circle size={AVATAR_SIZE} />
      <View
        style={[
          a.absolute,
          a.rounded_full,
          {
            end: 0,
            bottom: 0,
            padding: BADGE_RING,
            backgroundColor: ringColor,
          },
        ]}>
        <Skele.Circle blend size={BADGE_SIZE} />
      </View>
    </View>
  )
}
