import {type StyleProp, View, type ViewStyle} from 'react-native'

import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Person_Filled_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import type * as bsky from '#/types/bsky'

type Props = {
  profiles: bsky.profile.AnyProfileView[]
  size?: 'small' | 'medium' | 'large'
}

export function AvatarBubbles({profiles: allProfiles, size = 'large'}: Props) {
  const {currentAccount} = useSession()
  const profiles = allProfiles.filter(p => p.did !== currentAccount?.did)
  const containerSize = size === 'small' ? 40 : size === 'medium' ? 56 : 120
  const scale = size === 'small' ? 40 / 120 : size === 'medium' ? 56 / 120 : 1
  const marginOffset = size === 'small' || size === 'medium' ? -2 : 0

  let avatars = (
    <>
      <AvatarBubble
        profile={profiles[0] ?? allProfiles[0]}
        size={76}
        x={-2}
        y={-2}
        style={[a.z_20]}
        includeProfileBorder
      />
      <AvatarBubble
        profile={profiles[1]}
        size={76}
        x={42}
        y={42}
        style={[a.z_10]}
        includeProfileBorder
      />
    </>
  )

  if (profiles.length === 3) {
    avatars = (
      <>
        <AvatarBubble profile={profiles[0]} size={68} x={-2} y={-2} />
        <AvatarBubble profile={profiles[1]} size={56} x={38} y={62} />
        <AvatarBubble profile={profiles[2]} size={46} x={71} y={18} />
      </>
    )
  }

  if (profiles.length >= 4) {
    avatars = (
      <>
        <AvatarBubble profile={profiles[0]} size={68} x={-2} y={-2} />
        <AvatarBubble profile={profiles[1]} size={56} x={60} y={49} />
        <AvatarBubble profile={profiles[2]} size={42} x={14} y={74} />
        <AvatarBubble profile={profiles[3]} size={32} x={72} y={9} />
      </>
    )
  }

  return (
    <View
      style={[
        a.p_2xs,
        {
          height: containerSize,
          width: containerSize,
        },
      ]}>
      <View
        style={[
          {
            marginTop: marginOffset,
            marginLeft: marginOffset,
            transform: [{scale}],
            transformOrigin: 'top left',
          },
        ]}>
        {avatars}
      </View>
    </View>
  )
}

function AvatarBubble({
  profile,
  size,
  style,
  x,
  y,
  includeProfileBorder,
}: {
  profile?: bsky.profile.AnyProfileView
  size: number
  style?: StyleProp<ViewStyle>
  x: number
  y: number
  includeProfileBorder?: boolean
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.absolute,
        a.rounded_full,
        a.flex_grow_0,
        {transform: [{translateX: x}, {translateY: y}]},
        includeProfileBorder && {
          borderColor: t.atoms.text_inverted.color,
          borderWidth: 2,
        },
        style,
      ]}>
      {profile ? (
        <Avatar profile={profile} size={size} />
      ) : (
        <AvatarPlaceholder size={size} />
      )}
    </View>
  )
}

function Avatar({
  profile,
  size = 76,
}: {
  profile: bsky.profile.AnyProfileView
  size?: number
}) {
  return (
    <UserAvatar
      avatar={profile.avatar}
      size={size}
      type="user"
      hideLiveBadge
      noBorder
    />
  )
}

function AvatarPlaceholder({size = 76}: {size?: number}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_full,
        t.atoms.bg_contrast_200,
        {
          width: size,
          height: size,
        },
      ]}>
      <PersonIcon
        width={size * 0.5}
        height={size * 0.5}
        fill={t.atoms.text_inverted.color}
      />
    </View>
  )
}
