import {forwardRef, memo, useContext, useMemo} from 'react'
import {StyleSheet, View, type ViewProps, type ViewStyle} from 'react-native'
import {type StyleProp} from 'react-native'
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller'
import Animated, {
  type AnimatedScrollViewProps,
  useAnimatedProps,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useShellLayout} from '#/state/shell/shell-layout'
import {
  atoms as a,
  useBreakpoints,
  useLayoutBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {useDialogContext} from '#/components/Dialog'
import {CENTER_COLUMN_OFFSET, SCROLLBAR_OFFSET} from '#/components/Layout/const'
import {ScrollbarOffsetContext} from '#/components/Layout/context'
import {IS_WEB} from '#/env'

export * from '#/components/Layout/const'
export * as Header from '#/components/Layout/Header'

export type ScreenProps = React.ComponentProps<typeof View> & {
  style?: StyleProp<ViewStyle>
  noInsetTop?: boolean
}

/**
 * Outermost component of every screen
 */
export const Screen = memo(function Screen({
  style,
  noInsetTop,
  ...props
}: ScreenProps) {
  const {top} = useSafeAreaInsets()
  return (
    <>
      {IS_WEB && <WebCenterBorders />}
      <View
        style={[a.util_screen_outer, {paddingTop: noInsetTop ? 0 : top}, style]}
        {...props}
      />
    </>
  )
})

export type ContentProps = AnimatedScrollViewProps & {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  ignoreTabletLayoutOffset?: boolean
}

/**
 * Default scroll view for simple pages
 */
export const Content = memo(
  forwardRef<Animated.ScrollView, ContentProps>(function Content(
    {
      children,
      style,
      contentContainerStyle,
      ignoreTabletLayoutOffset,
      ...props
    },
    ref,
  ) {
    const t = useTheme()
    const {footerHeight} = useShellLayout()
    const animatedProps = useAnimatedProps(() => {
      return {
        scrollIndicatorInsets: {
          bottom: footerHeight.get(),
          top: 0,
          right: 1,
        },
      } satisfies AnimatedScrollViewProps
    })

    return (
      <Animated.ScrollView
        ref={ref}
        id="content"
        automaticallyAdjustsScrollIndicatorInsets={false}
        indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
        // sets the scroll inset to the height of the footer
        animatedProps={animatedProps}
        style={[scrollViewStyles.common, style]}
        contentContainerStyle={[
          scrollViewStyles.contentContainer,
          contentContainerStyle,
        ]}
        {...props}>
        {IS_WEB ? (
          <Center ignoreTabletLayoutOffset={ignoreTabletLayoutOffset}>
            {/* @ts-expect-error web only -esb */}
            {children}
          </Center>
        ) : (
          children
        )}
      </Animated.ScrollView>
    )
  }),
)

const scrollViewStyles = StyleSheet.create({
  common: {
    width: '100%',
  },
  contentContainer: {
    paddingBottom: 100,
  },
})

export type KeyboardAwareContentProps = KeyboardAwareScrollViewProps & {
  children: React.ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * Default scroll view for simple pages.
 *
 * BE SURE TO TEST THIS WHEN USING, it's untested as of writing this comment.
 */
export const KeyboardAwareContent = memo(function LayoutKeyboardAwareContent({
  children,
  style,
  contentContainerStyle,
  ...props
}: KeyboardAwareContentProps) {
  return (
    <KeyboardAwareScrollView
      style={[scrollViewStyles.common, style]}
      contentContainerStyle={[
        scrollViewStyles.contentContainer,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      {...props}>
      {IS_WEB ? <Center>{children}</Center> : children}
    </KeyboardAwareScrollView>
  )
})

/**
 * Utility component to center content within the screen
 */
export const Center = memo(function LayoutCenter({
  children,
  style,
  ignoreTabletLayoutOffset,
  ...props
}: ViewProps & {ignoreTabletLayoutOffset?: boolean}) {
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const {isWithinDialog} = useDialogContext()
  const ctx = useMemo(() => ({isWithinOffsetView: true}), [])
  return (
    <View
      style={[
        a.w_full,
        a.mx_auto,
        gtMobile && {
          maxWidth: 600,
        },
        !isWithinOffsetView && {
          transform: [
            {
              translateX:
                centerColumnOffset &&
                !ignoreTabletLayoutOffset &&
                !isWithinDialog
                  ? CENTER_COLUMN_OFFSET
                  : 0,
            },
            {translateX: web(SCROLLBAR_OFFSET) ?? 0},
          ],
        },
        style,
      ]}
      {...props}>
      <ScrollbarOffsetContext.Provider value={ctx}>
        {children}
      </ScrollbarOffsetContext.Provider>
    </View>
  )
})

/**
 * Only used within `Layout.Screen`, not for reuse
 */
const WebCenterBorders = memo(function LayoutWebCenterBorders() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
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
            {translateX: '-50%'},
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0},
            ...a.scrollbar_offset.transform,
          ],
        }),
      ]}
    />
  ) : null
})
