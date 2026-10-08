import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import type * as bsky from '#/types/bsky'

/**
 * The colour family of a notification's icon badge.
 */
export type BadgeTone =
  'like' | 'repost' | 'follow' | 'conversation' | 'activity' | 'neutral'

/**
 * Activity (subscribed post) badges use an orange that isn't in the ALF
 * palette yet.
 */
const ACTIVITY_ORANGE = '#F26022'

const AVATAR_SIZE = 36
const BADGE_SIZE = 20

/**
 * The primary actor's avatar, with an icon badge overlapping its bottom-end
 * corner that says what kind of notification this is. Omit `icon` for an
 * unbadged avatar.
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
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderateProfile(profile, moderationOpts)
    : undefined

  const badgeColor = {
    like: t.palette.pink,
    repost: t.palette.positive_500,
    follow: t.palette.primary_500,
    conversation: t.palette.positive_500,
    activity: ACTIVITY_ORANGE,
    neutral: t.palette.contrast_500,
  }[tone]

  return (
    <View style={{width: AVATAR_SIZE + 6, height: AVATAR_SIZE + 4}}>
      <PreviewableUserAvatar
        size={AVATAR_SIZE}
        profile={profile}
        moderation={moderation?.ui('avatar')}
        type={profile.associated?.labeler ? 'labeler' : 'user'}
      />
      {Icon && (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {
              end: 0,
              bottom: 0,
              width: BADGE_SIZE,
              height: BADGE_SIZE,
              backgroundColor: badgeColor,
            },
          ]}>
          <Icon size="xs" fill={t.palette.white} />
        </View>
      )}
    </View>
  )
}
