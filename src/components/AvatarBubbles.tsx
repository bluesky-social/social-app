import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Person_Filled_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'

type Props = {
  profiles: number[]
  size?: 'small' | 'medium' | 'large'
}

/**
 * TODO This is just layout for now.
 */
export function AvatarBubbles({profiles, size = 'large'}: Props) {
  const containerSize = size === 'small' ? 40 : size === 'medium' ? 56 : 120
  const scale = size === 'small' ? 40 / 120 : size === 'medium' ? 56 / 120 : 1
  const marginOffset = size === 'small' || size === 'medium' ? -2 : 0

  let avatars = (
    <>
      <AvatarBubble size={76} x={-2} y={-2} style={[a.z_20]} />
      <AvatarBubble size={76} x={42} y={42} style={[a.z_10]} />
    </>
  )

  if (profiles.length === 3) {
    avatars = (
      <>
        <AvatarBubble size={68} x={-2} y={-2} />
        <AvatarBubble size={56} x={38} y={62} />
        <AvatarBubble size={46} x={71} y={18} />
      </>
    )
  }

  if (profiles.length >= 4) {
    avatars = (
      <>
        <AvatarBubble size={68} x={-2} y={-2} />
        <AvatarBubble size={56} x={60} y={49} />
        <AvatarBubble size={42} x={14} y={74} />
        <AvatarBubble size={32} x={72} y={9} />
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

type AvatarBubbleProps = {
  size: number
  style?: StyleProp<ViewStyle>
  x: number
  y: number
}

function AvatarBubble({size, style, x, y}: AvatarBubbleProps) {
  const t = useTheme()

  return (
    <View
      style={[
        a.absolute,
        a.rounded_full,
        a.flex_grow_0,
        {
          borderColor: t.atoms.text_inverted.color,
          borderWidth: 2,
          transform: [{translateX: x}, {translateY: y}],
        },
        style,
      ]}>
      <AvatarPlaceholder size={size} />
    </View>
  )
}

type AvatarProps = {
  size?: number
}

function AvatarPlaceholder({size = 76}: AvatarProps) {
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
