import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {StarterPackMultiPathLarge as StarterPackIcon} from '#/components/icons/brands/StarterPack'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon} from '#/components/icons/LikeRepost'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {
  Repost_Stroke2_Corner3_Rounded as RepostIcon,
  RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost'
import * as Skele from '#/components/Skeleton'
import type * as bsky from '#/types/bsky'
import {useItemBackgroundColor} from './Root'

/**
 * The colour family of a notification's icon badge.
 */
export type BadgeTone = 'follow' | 'conversation' | 'activity' | 'neutral'

/**
 * The v1-style icon that a reaction row has in its left column instead of an
 * avatar.
 */
export type Glyph =
  | 'like'
  | 'repost'
  | 'likeViaRepost'
  | 'repostViaRepost'
  | 'follow'
  | 'starterPack'

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
export const AVATAR_SIZE = 42
const BADGE_SIZE = 20
/**
 * The width of the ring around the badge, in the row's background colour,
 * which sets it apart from the avatar.
 */
const BADGE_RING = 2

/**
 * The space the avatar sits in, with room below for the badge to overlap its
 * bottom-end corner. It's only as wide as the avatar: the badge hangs out of
 * its end side into the gap rather than pushing the text along.
 */
const SLOT_SIZE = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE + 4 + BADGE_RING,
}

/**
 * Where the badge's ring sits in the slot. The badge itself sticks out 2px
 * past the avatar's end edge.
 */
const BADGE_POSITION = {
  end: -(2 + BADGE_RING),
  bottom: 0,
}

/**
 * The primary actor's avatar, with an icon badge overlapping its bottom-end
 * corner that says what kind of notification this is. Omit `icon` for an
 * unbadged avatar. Likes, reposts and follows have an `Icon` instead.
 */
export function Avatar({
  profile,
  icon: Icon,
  tone = 'follow',
}: {
  profile: bsky.profile.AnyProfileView
  icon?: React.ComponentType<SVGIconProps>
  tone?: BadgeTone
}) {
  const t = useTheme()
  const ringColor = useItemBackgroundColor()
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined

  const badgeColor = {
    follow: t.palette.primary_500,
    conversation: CONVERSATION_PURPLE,
    activity: ACTIVITY_ORANGE,
    neutral: t.palette.contrast_500,
  }[tone]

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
      {Icon && (
        /*
         * The ring is a padded circle behind the badge rather than a border
         * on it. A view's background is drawn under its border too, so it
         * would show through the anti-aliased edge of the ring.
         */
        <View
          style={[
            a.absolute,
            a.rounded_full,
            BADGE_POSITION,
            {padding: BADGE_RING, backgroundColor: ringColor},
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
            <Icon size="xs" fill={t.palette.white} />
          </View>
        </View>
      )}
    </View>
  )
}

/**
 * The left column of a like, repost, follow and the like, as in v1: an icon
 * saying what happened, where the avatar would be, right-aligned to its end
 * edge. The people are in the row's `Item.AvatarRow` instead.
 */
export function Icon({glyph}: {glyph: Glyph}) {
  return (
    <View style={[a.align_end, {width: AVATAR_SIZE}]}>
      <GlyphIcon glyph={glyph} />
    </View>
  )
}

function GlyphIcon({glyph}: {glyph: Glyph}) {
  const t = useTheme()

  switch (glyph) {
    case 'like':
      return <HeartIcon size="2xl" fill={t.palette.pink} />
    case 'repost':
      return <RepostIcon size="2xl" fill={t.palette.positive_500} />
    case 'likeViaRepost':
      return <LikeRepostIcon size="2xl" fill={t.palette.pink} />
    case 'repostViaRepost':
      return <RepostRepostIcon size="2xl" fill={t.palette.positive_500} />
    case 'follow':
      return <PersonPlusIcon size="2xl" fill={t.palette.primary_500} />
    case 'starterPack':
      return <StarterPackIcon width={34} gradient="sky" />
  }
}

/**
 * Stands in for a badged `Avatar` while the row loads, in the same slot, with
 * a faint circle where the badge goes.
 */
export function AvatarSkeleton() {
  const ringColor = useItemBackgroundColor()

  return (
    <View style={SLOT_SIZE}>
      <Skele.Circle size={AVATAR_SIZE} />
      <View
        style={[
          a.absolute,
          a.rounded_full,
          BADGE_POSITION,
          {padding: BADGE_RING, backgroundColor: ringColor},
        ]}>
        <Skele.Circle blend size={BADGE_SIZE} />
      </View>
    </View>
  )
}

/**
 * Stands in for an `Icon` while the row loads.
 */
export function IconSkeleton() {
  return (
    <View style={[a.align_end, {width: AVATAR_SIZE}]}>
      <Skele.Circle size={32} />
    </View>
  )
}
