import React, {useContext, useMemo} from 'react'
import {StyleSheet, View, ViewProps, ViewStyle} from 'react-native'
import {StyleProp} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller'
import Animated, {AnimatedScrollViewProps} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {isWeb} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'

export * as Header from '#/components/Layout/Header'

// Every screen should have a Layout component wrapping it.
// This component provides a default padding for the top of the screen.
// This allows certain screens to avoid the top padding if they want to.

const LayoutContext = React.createContext({
  withinScreen: false,
  topPaddingDisabled: false,
  withinScrollView: false,
})

export type ScreenProps = React.ComponentProps<typeof View> & {
  disableTopPadding?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Every screen should have a Layout.Screen component wrapping it.
 * This component provides a default padding for the top of the screen
 * and height/minHeight
 */
export const Screen = React.memo(function Screen({
  disableTopPadding = false,
  style,
  ...props
}: ScreenProps) {
  const {top} = useSafeAreaInsets()
  const context = useMemo(
    () => ({
      withinScreen: true,
      topPaddingDisabled: disableTopPadding,
      withinScrollView: false,
    }),
    [disableTopPadding],
  )
  return (
    <LayoutContext.Provider value={context}>
      {isWeb && <WebCenterBorders />}
      <View
        style={[
          {paddingTop: disableTopPadding ? 0 : top},
          a.util_screen_outer,
          style,
        ]}
        {...props}
      />
    </LayoutContext.Provider>
  )
})

export type ContentProps = AnimatedScrollViewProps & {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export const Content = React.memo(function Content({
  children,
  style,
  contentContainerStyle,
  ...props
}: ContentProps) {
  const context = useContext(LayoutContext)
  const newContext = useMemo(
    () => ({...context, withinScrollView: true}),
    [context],
  )
  return (
    <LayoutContext.Provider value={newContext}>
      <Animated.ScrollView
        id="content"
        style={[styles.scrollViewCommonStyles, style]}
        contentContainerStyle={[
          styles.scrollViewContentContainer,
          contentContainerStyle,
        ]}
        {...props}>
        {isWeb ? (
          // @ts-ignore web only -esb
          <Center>{children}</Center>
        ) : (
          children
        )}
      </Animated.ScrollView>
    </LayoutContext.Provider>
  )
})

export type KeyboardAwareContentProps = KeyboardAwareScrollViewProps & {
  children: React.ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}

export const KeyboardAwareContent = React.forwardRef(function LayoutScrollView(
  {children, style, contentContainerStyle, ...props}: KeyboardAwareContentProps,
  _ref: React.Ref<typeof KeyboardAwareScrollView>,
) {
  return (
    <KeyboardAwareScrollView
      style={[styles.scrollViewCommonStyles, style]}
      contentContainerStyle={[
        styles.scrollViewContentContainer,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      {...props}>
      {isWeb ? <Center>{children}</Center> : children}
    </KeyboardAwareScrollView>
  )
})

export const WebCenterBorders = React.forwardRef(function LayoutContent() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return gtMobile ? (
    <View
      style={[
        a.fixed,
        a.inset_0,
        a.border_l,
        a.border_r,
        t.atoms.border_contrast_low,
        web({
          width: 602,
          left: '50%',
          transform: [
            {
              translateX: '-50%',
            },
            {
              translateX: `var(--scrollbar-offset-negative)`,
            },
          ],
        }),
      ]}
    />
  ) : null
})

export const Center = React.forwardRef(function LayoutContent(
  {children, style, ...props}: ViewProps,
  ref: React.Ref<View>,
) {
  const {gtMobile} = useBreakpoints()
  return (
    <View
      ref={ref}
      style={[
        a.util_screen_outer,
        a.w_full,
        a.mx_auto,
        gtMobile && {
          maxWidth: 600,
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  scrollViewCommonStyles: {
    width: '100%',
  },
  scrollViewContentContainer: {
    paddingBottom: 100,
  },
})
