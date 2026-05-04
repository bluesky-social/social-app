import {useEffect} from 'react'
import {View} from 'react-native'
import Animated, {
  Easing,
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

type Layout = {
  size: number
  x: number
  y: number
  zIndex?: number
  border?: boolean
}

type Props = {
  animate?: boolean
  profiles: bsky.profile.AnyProfileView[]
  size?: number
}

export function AvatarBubbles({
  animate = false,
  profiles: allProfiles,
  size = 120,
}: Props) {
  const {currentAccount} = useSession()
  const profiles =
    allProfiles.length > 2
      ? allProfiles.filter(p => p.did !== currentAccount?.did)
      : allProfiles
  const scale = size / 120
  const marginOffset = size < 120 ? -2 : 0

  const initialValue = animate ? 0 : 1
  const p0 = useSharedValue(initialValue)
  const p1 = useSharedValue(initialValue)
  const p2 = useSharedValue(initialValue)
  const p3 = useSharedValue(initialValue)

  useEffect(() => {
    if (!animate) return
    const animateBubble = (p: SharedValue<number>, i: number) => {
      p.set(0)
      p.set(() =>
        withDelay(
          500 + i * 100,
          withTiming(1, {
            duration: 250,
            easing: Easing.out(Easing.back(1.75)),
          }),
        ),
      )
    }
    animateBubble(p0, 0)
    animateBubble(p1, 1)
    animateBubble(p2, 2)
    animateBubble(p3, 3)
  }, [animate, p0, p1, p2, p3])

  const scales = [p0, p1, p2, p3]
  const layouts = getLayouts(profiles.length)

  return (
    <Animated.View style={[a.p_2xs, {height: size, width: size}]}>
      <View
        style={{
          marginTop: marginOffset,
          marginLeft: marginOffset,
          transform: [{scale}],
          transformOrigin: 'top left',
        }}>
        {layouts.map((layout, i) => (
          <AvatarBubble
            key={i}
            profile={profiles[i]}
            scale={scales[i]}
            size={layout.size}
            x={layout.x}
            y={layout.y}
            zIndex={layout.zIndex}
            includeProfileBorder={layout.border}
          />
        ))}
      </View>
    </Animated.View>
  )
}

function AvatarBubble({
  profile,
  scale,
  size,
  x,
  y,
  zIndex,
  includeProfileBorder,
}: {
  profile?: bsky.profile.AnyProfileView
  scale: SharedValue<number>
  size: number
  x: number
  y: number
  zIndex?: number
  includeProfileBorder?: boolean
}) {
  const t = useTheme()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: x}, {translateY: y}, {scale: scale.get()}],
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
        zIndex != null && {zIndex},
        animatedStyle,
      ]}>
      {profile ? (
        <UserAvatar
          avatar={profile.avatar}
          size={size}
          type="user"
          hideLiveBadge
          noBorder
        />
      ) : (
        <AvatarPlaceholder size={size} />
      )}
    </Animated.View>
  )
}

function AvatarPlaceholder({size}: {size: number}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_full,
        t.atoms.bg_contrast_200,
        {width: size, height: size},
      ]}>
      <PersonIcon
        width={size * 0.5}
        height={size * 0.5}
        fill={t.atoms.text_inverted.color}
      />
    </View>
  )
}

function getLayouts(count: number): Layout[] {
  if (count === 3) {
    return [
      {size: 68, x: -2, y: -2},
      {size: 56, x: 38, y: 62},
      {size: 46, x: 71, y: 18},
    ]
  }
  if (count >= 4) {
    return [
      {size: 68, x: -2, y: -2},
      {size: 56, x: 60, y: 49},
      {size: 42, x: 14, y: 74},
      {size: 32, x: 72, y: 9},
    ]
  }
  return [
    {size: 76, x: -2, y: -2, zIndex: 20, border: true},
    {size: 76, x: 42, y: 42, zIndex: 10, border: true},
  ]
}
