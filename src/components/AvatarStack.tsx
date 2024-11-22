import {View} from 'react-native'
import {moderateProfile} from '@atproto/api'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfilesQuery} from '#/state/queries/profile'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'

export function AvatarStack({
  profiles,
  size = 26,
}: {
  profiles: string[]
  size?: number
}) {
  const halfSize = size / 2
  const {data, error} = useProfilesQuery({handles: profiles})
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  if (error) {
    console.error(error)
    return null
  }

  const isPending = !data || !moderationOpts

  const items = isPending
    ? Array.from({length: profiles.length}).map((_, i) => ({
        key: i,
        profile: null,
        moderation: null,
      }))
    : data.profiles.map(item => ({
        key: item.did,
        profile: item,
        moderation: moderateProfile(item, moderationOpts),
      }))

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.relative,
        {width: size + (items.length - 1) * halfSize},
      ]}>
      {items.map((item, i) => (
        <View
          key={item.key}
          style={[
            t.atoms.bg_contrast_25,
            a.relative,
            {
              width: size,
              height: size,
              left: i * -halfSize,
              borderWidth: 1,
              borderColor: t.atoms.bg.backgroundColor,
              borderRadius: 999,
              zIndex: 3 - i,
            },
          ]}>
          {item.profile && (
            <UserAvatar
              size={size - 2}
              avatar={item.profile.avatar}
              moderation={item.moderation.ui('avatar')}
            />
          )}
        </View>
      ))}
    </View>
  )
}
