import {useCallback, useEffect} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'

import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Person_Filled_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import type * as bsky from '#/types/bsky'

type Props = {
  animate?: boolean
  profiles: bsky.profile.AnyProfileView[]
  size?: 'small' | 'medium' | 'large' | number
}

export function AvatarBubbles({
  animate = false,
  profiles: allProfiles,
  size = 'large',
}: Props) {
  const {currentAccount} = useSession()
  const profiles = allProfiles.filter(p => p.did !== currentAccount?.did)
  const containerSize =
    typeof size === 'number'
      ? size
      : size === 'small'
        ? 40
        : size === 'medium'
          ? 56
          : 120
  const scale =
    typeof size === 'number'
      ? size / 120
      : size === 'small'
        ? 40 / 120
        : size === 'medium'
          ? 56 / 120
          : 1
  const marginOffset = size === 'small' || size === 'medium' ? -2 : 0

  const initialValue = animate ? 0 : 1
  const p0 = useSharedValue(initialValue)
  const p1 = useSharedValue(initialValue)
  const p2 = useSharedValue(initialValue)
  const p3 = useSharedValue(initialValue)

  const animateScale = (p: Animated.SharedValue<number>, index: number) => {
    p.set(0)
    p.set(() =>
      withDelay(
        500 + index * 100,
        withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.back(1.75)),
        }),
      ),
    )
  }

  const playScaleAnimation = useCallback(() => {
    animateScale(p0, 0)
    animateScale(p1, 1)
    animateScale(p2, 2)
    animateScale(p3, 3)
  }, [p0, p1, p2, p3])

  useEffect(() => {
    if (!animate) return
    playScaleAnimation()
  }, [animate, playScaleAnimation])

  let avatars = (
    <>
      <AvatarBubble
        profile={profiles[0] ?? allProfiles[0]}
        scale={p0}
        size={76}
        x={-2}
        y={-2}
        style={[a.z_20]}
        includeProfileBorder
      />
      <AvatarBubble
        profile={profiles[1]}
        scale={p1}
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
        <AvatarBubble
          profile={profiles[0]}
          scale={p0}
          size={68}
          x={-2}
          y={-2}
        />
        <AvatarBubble
          profile={profiles[1]}
          scale={p1}
          size={56}
          x={38}
          y={62}
        />
        <AvatarBubble
          profile={profiles[2]}
          scale={p2}
          size={46}
          x={71}
          y={18}
        />
      </>
    )
  }

  if (profiles.length >= 4) {
    avatars = (
      <>
        <AvatarBubble
          profile={profiles[0]}
          scale={p0}
          size={68}
          x={-2}
          y={-2}
        />
        <AvatarBubble
          profile={profiles[1]}
          scale={p1}
          size={56}
          x={60}
          y={49}
        />
        <AvatarBubble
          profile={profiles[2]}
          scale={p2}
          size={42}
          x={14}
          y={74}
        />
        <AvatarBubble profile={profiles[3]} scale={p3} size={32} x={72} y={9} />
      </>
    )
  }

  return (
    <Animated.View
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
    </Animated.View>
  )
}

function AvatarBubble({
  profile,
  scale,
  size,
  style,
  x,
  y,
  includeProfileBorder,
}: {
  profile?: bsky.profile.AnyProfileView
  scale: SharedValue<number>
  size: number
  style?: StyleProp<ViewStyle>
  x: number
  y: number
  includeProfileBorder?: boolean
}) {
  const t = useTheme()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: x},
      {translateY: y},
      {scale: interpolate(scale.get(), [0, 1], [0, 1])},
    ],
  }))

  return (
    <Animated.View
      style={[
        a.absolute,
        a.rounded_full,
        a.flex_grow_0,
        includeProfileBorder && {
          borderColor: t.atoms.text_inverted.color,
          borderWidth: 2,
        },
        style,
        animatedStyle,
      ]}>
      {profile ? (
        <Avatar profile={profile} size={size} />
      ) : (
        <AvatarPlaceholder size={size} />
      )}
    </Animated.View>
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
