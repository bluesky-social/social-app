import React, {memo, useState} from 'react'
import {LayoutChangeEvent, StyleSheet, View} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  AppBskyActorDefs,
  AppBskyLabelerDefs,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {useIsFocused} from '@react-navigation/native'

import {isNative} from '#/platform/detection'
import {useSetLightStatusBar} from '#/state/shell/light-status-bar'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme} from '#/alf'
import {ProfileHeaderLabeler} from './ProfileHeaderLabeler'
import {ProfileHeaderStandard} from './ProfileHeaderStandard'

let ProfileHeaderLoading = (_props: {}): React.ReactNode => {
  const t = useTheme()
  return (
    <View style={t.atoms.bg}>
      <LoadingPlaceholder width="100%" height={150} style={{borderRadius: 0}} />
      <View
        style={[
          t.atoms.bg,
          {borderColor: t.atoms.bg.backgroundColor},
          styles.avi,
        ]}>
        <LoadingPlaceholder width={90} height={90} style={styles.br45} />
      </View>
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          <LoadingPlaceholder width={140} height={34} style={styles.br50} />
        </View>
      </View>
    </View>
  )
}
ProfileHeaderLoading = memo(ProfileHeaderLoading)
export {ProfileHeaderLoading}

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
  setMinimumHeight: (height: number) => void
}

let ProfileHeader = ({setMinimumHeight, ...props}: Props): React.ReactNode => {
  let content
  if (props.profile.associated?.labeler) {
    if (!props.labeler) {
      content = <ProfileHeaderLoading />
    } else {
      content = <ProfileHeaderLabeler {...props} labeler={props.labeler} />
    }
  } else {
    content = <ProfileHeaderStandard {...props} />
  }

  return (
    <>
      {isNative && (
        <MinimalHeader
          onLayout={evt => setMinimumHeight(evt.nativeEvent.layout.height)}
          profile={props.profile}
          hideBackButton={props.hideBackButton}
        />
      )}
      {content}
    </>
  )
}
ProfileHeader = memo(ProfileHeader)
export {ProfileHeader}

const MinimalHeader = React.memo(function MinimalHeader({
  onLayout,
}: {
  onLayout: (e: LayoutChangeEvent) => void
  profile: AppBskyActorDefs.ProfileViewDetailed
  hideBackButton?: boolean
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const ctx = usePagerHeaderContext()
  const [visible, setVisible] = useState(false)
  const [minimalHeaderHeight, setMinimalHeaderHeight] = React.useState(0)
  const isScreenFocused = useIsFocused()
  if (!ctx) throw new Error('MinimalHeader cannot be used on web')
  const {scrollY, headerHeight} = ctx

  const animatedStyle = useAnimatedStyle(() => {
    // if we don't yet have the min header height in JS, hide
    if (!_WORKLET || minimalHeaderHeight === 0) {
      return {
        opacity: 0,
      }
    }
    const pastThreshold = scrollY.get() > 100
    return {
      opacity: pastThreshold
        ? withTiming(1, {duration: 75})
        : withTiming(0, {duration: 75}),
      transform: [
        {
          translateY: Math.min(
            scrollY.get(),
            headerHeight - minimalHeaderHeight,
          ),
        },
      ],
    }
  })

  useAnimatedReaction(
    () => scrollY.get() > 100,
    (value, prev) => {
      if (prev !== value) {
        runOnJS(setVisible)(value)
      }
    },
  )

  useSetLightStatusBar(isScreenFocused && !visible)

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      aria-hidden={!visible}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      onLayout={evt => {
        setMinimalHeaderHeight(evt.nativeEvent.layout.height)
        onLayout(evt)
      }}
      style={[
        a.absolute,
        a.z_50,
        t.atoms.bg,
        {
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top,
        },
        animatedStyle,
      ]}
    />
  )
})
MinimalHeader.displayName = 'MinimalHeader'

const styles = StyleSheet.create({
  avi: {
    position: 'absolute',
    top: 110,
    left: 10,
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonsLine: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  br45: {borderRadius: 45},
  br50: {borderRadius: 50},
})
