import {useLayoutEffect, useMemo, useState} from 'react'
import {useWindowDimensions} from 'react-native'
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated'
import {useIsFocused, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {IS_LIQUID_GLASS} from '#/env'
import {Outer as DefaultOuter, type OuterProps} from './index.shared'

export {
  BackButton,
  Content,
  MenuButton,
  type OuterProps,
  Slot,
  SubtitleText,
  TitleText,
} from './index.shared'

export function Outer(props: OuterProps) {
  if (IS_LIQUID_GLASS && props.transparent) {
    return <TransparentOuter {...props} />
  }

  return <DefaultOuter {...props} />
}

function TransparentOuter({children, headerRef}: OuterProps) {
  const [headerWidth, setHeaderWidth] = useState(0)
  const {width: screenWidth} = useWindowDimensions()

  // bit of a hack - react-native-screens initially renders the header too wide
  // so let's delay showing it until the padding has been applied -sfn
  const isInitialRender = headerWidth === 0 || headerWidth === screenWidth
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(isInitialRender ? 0 : 1, {duration: 100}),
  }))

  const headerElement = useMemo(() => {
    return (
      <Animated.View
        ref={headerRef}
        onLayout={evt => setHeaderWidth(evt.nativeEvent.layout.width)}
        style={[
          a.flex_1,
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.px_xs,
          animatedOpacity,
        ]}>
        {children}
      </Animated.View>
    )
  }, [children, headerRef, animatedOpacity])

  // this is how expo-router handles it
  // https://github.com/expo/expo/blob/main/packages/expo-router/src/views/Screen.tsx#L34
  // note: I'm skipping handling preloading for now -sfn
  const navigation = useNavigation<NavigationProp>()
  const isFocused = useIsFocused()
  useLayoutEffect(() => {
    if (isFocused) {
      navigation.setOptions({
        headerShown: true,
        // abuse the headerItems API so we get
        // the sweet sweet progressive blur header.
        // unclear why just `header: () => elem` doesn't work -sfn
        unstable_headerRightItems: () => [
          {
            type: 'custom',
            element: headerElement,
            hidesSharedBackground: true,
          },
        ],
        headerTransparent: true,
        headerBackVisible: false,
        scrollEdgeEffects: {
          top: 'soft',
        },
      })
    }
  }, [isFocused, navigation, headerElement])

  return null
}
