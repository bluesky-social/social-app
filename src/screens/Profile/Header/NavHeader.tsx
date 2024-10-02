import React, {useState} from 'react'
import {View} from 'react-native'
import Animated, {
  runOnJS,
  SlideInUp,
  SlideOutUp,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {StatusBar} from 'expo-status-bar'
import {AppBskyActorDefs, ModerationDecision} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {Shadow} from '#/state/cache/types'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export const PROFILE_NAV_HEADER_HEIGHT = 50

interface Props {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
  backButton?: React.ReactNode
}

export function NavHeader({profile, moderation, backButton}: Props) {
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View
      style={[
        {height: PROFILE_NAV_HEADER_HEIGHT + insets.top + a.border.borderWidth},
        {paddingTop: insets.top},
        a.w_full,
        t.atoms.bg,
      ]}>
      <View style={[a.flex_1, a.flex_row, a.gap_md, a.px_lg, a.align_center]}>
        {backButton}
        <UserAvatar
          avatar={profile.avatar}
          size={PROFILE_NAV_HEADER_HEIGHT - 12}
        />
        <View style={[a.flex_1]}>
          <Text style={[a.font_bold, a.text_lg, a.leading_tight]}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.ui('displayName'),
            )}
          </Text>
          <Text style={[a.text_sm, a.leading_tight]}>
            {isInvalidHandle(profile.handle)
              ? _(msg`⚠Invalid Handle`)
              : `@${profile.handle}`}
          </Text>
        </View>
      </View>
    </View>
  )
}

export function NavHeaderScrollLinked({...props}: Props) {
  const pagerContext = usePagerHeaderContext()

  if (!pagerContext) {
    throw new Error(
      'NavHeaderScrollLinked must be used within a PagerHeaderProvider and cannot be used on web',
    )
  }

  const {scrollY, headerHeight} = pagerContext
  const [showHeader, setShowHeader] = useState(false)
  const {top: topInset} = useSafeAreaInsets()

  const navHeaderHeight = topInset + PROFILE_NAV_HEADER_HEIGHT

  useAnimatedReaction(
    () => scrollY.value > 60,
    (value, prevValue) => {
      if (value !== prevValue) {
        runOnJS(setShowHeader)(value)
      }
    },
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateY: Math.min(scrollY.value, headerHeight - navHeaderHeight)},
    ],
  }))

  return (
    <>
      {showHeader ? (
        <Animated.View
          entering={SlideInUp.duration(200)}
          exiting={SlideOutUp.duration(200)}
          style={[
            animatedStyle,
            a.absolute,
            {top: 0, left: 0, right: 0},
            a.z_50,
          ]}>
          <NavHeader {...props} />
        </Animated.View>
      ) : (
        <StatusBar style="light" />
      )}
    </>
  )
}
