import {View} from 'react-native'
import {
  AppBskyActorDefs,
  ChatBskyActorDefs,
  moderateProfile,
} from '@atproto/api'

import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfilesQuery} from '#/state/queries/profile'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'

export function AvatarStack({
  profiles,
  size = 26,
  backgroundColor,
}: {
  profiles:
    | string[]
    | AppBskyActorDefs.ProfileView[]
    | ChatBskyActorDefs.ProfileViewBasic[]
  size?: number
  backgroundColor?: string
}) {
  if (typeof profiles[0] === 'string') {
    return (
      <AvatarStackWithFetch
        profiles={profiles as string[]}
        size={size}
        backgroundColor={backgroundColor}
      />
    )
  }
  return (
    <AvatarStackInner
      profiles={
        profiles as
          | AppBskyActorDefs.ProfileView[]
          | ChatBskyActorDefs.ProfileViewBasic[]
      }
      size={size}
      backgroundColor={backgroundColor}
    />
  )
}

function AvatarStackWithFetch({
  profiles,
  size,
  backgroundColor,
}: {
  profiles: string[]
  size: number
  backgroundColor?: string
}) {
  const {data, error} = useProfilesQuery({handles: profiles})

  if (error) {
    if (error.name !== 'AbortError') {
      logger.error('Error fetching profiles for AvatarStack', {
        safeMessage: error,
      })
    }
    return null
  }

  return (
    <AvatarStackInner
      numPending={profiles.length}
      profiles={data?.profiles || []}
      size={size}
      backgroundColor={backgroundColor}
    />
  )
}

function AvatarStackInner({
  profiles,
  size,
  numPending,
  backgroundColor,
}: {
  profiles:
    | AppBskyActorDefs.ProfileView[]
    | ChatBskyActorDefs.ProfileViewBasic[]
  size: number
  numPending?: number
  backgroundColor?: string
}) {
  const halfSize = size / 2
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  const isPending = numPending || !moderationOpts

  const items = isPending
    ? Array.from({length: numPending ?? profiles.length}).map((_, i) => ({
        key: i,
        profile: null,
        moderation: null,
      }))
    : profiles.map(item => ({
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
              borderColor: backgroundColor ?? t.atoms.bg.backgroundColor,
              borderRadius: 999,
              zIndex: 3 - i,
            },
          ]}>
          {item.profile && (
            <UserAvatar
              size={size - 2}
              avatar={item.profile.avatar}
              type={item.profile.associated?.labeler ? 'labeler' : 'user'}
              moderation={item.moderation.ui('avatar')}
            />
          )}
        </View>
      ))}
    </View>
  )
}
