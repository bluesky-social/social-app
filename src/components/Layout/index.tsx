import {memo, useContext, useMemo} from 'react'
import {
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import Animated, {
  type AnimatedRef,
  type AnimatedScrollViewProps,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useEnableMinimalShellModeForScreen} from '#/state/shell'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useIsWithinSplitView} from '#/screens/Messages/components/splitView/context'
import {
  atoms as a,
  useBreakpoints,
  useLayoutBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {shouldCenterNativeTabletContent} from '#/alf/breakpoints.shared'
import {useDialogContext} from '#/components/Dialog'
import {
  CENTER_COLUMN_OFFSET,
  CENTER_COLUMN_WIDTH,
  SCROLLBAR_OFFSET,
} from '#/components/Layout/const'
import {ScrollbarOffsetContext} from '#/components/Layout/context'
import {IS_IPAD, IS_WEB} from '#/env'

export * from '#/components/Layout/const'
export * as Header from '#/components/Layout/Header'

export type ScreenProps = React.ComponentProps<typeof View> & {
  style?: StyleProp<ViewStyle>
  noInsetTop?: boolean
  minimalShell?: boolean
  /** Skip the centered desktop-width borders for immersive content. */
  fullBleed?: boolean
}

/**
 * Outermost component of every screen
 */
export const Screen = memo(function Screen({
  style,
  noInsetTop,
  minimalShell = false,
  fullBleed = false,
  ...props
}: ScreenProps) {
  const {top} = useSafeAreaInsets()
  const {isWithinSplitView} = useIsWithinSplitView()
  const {gtMobile} = useBreakpoints()

  useEnableMinimalShellModeForScreen({enabled: minimalShell})

  return (
    <>
      {IS_WEB && !fullBleed && !isWithinSplitView ? (
        <WebCenterBorders />
      ) : !fullBleed && IS_IPAD && gtMobile && !isWithinSplitView ? (
        <NativeCenterBorders />
      ) : null}
      <View
        style={[
          a.util_screen_outer,
          {paddingTop: noInsetTop ? 0 : top},
          isWithinSplitView && {maxHeight: '100%'},
          style,
        ]}
        {...props}
      />
    </>
  )
})

export type ContentProps = AnimatedScrollViewProps & {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  ignoreTabletLayoutOffset?: boolean
  ref?: AnimatedRef<Animated.ScrollView>
}

/**
 * Default scroll view for simple pages
 */
export const Content = memo(function Content({
  children,
  style,
  contentContainerStyle,
  centerContent,
  ignoreTabletLayoutOffset,
  automaticallyAdjustsScrollIndicatorInsets,
  ref,
  ...props
}: ContentProps) {
  const t = useTheme()
  const {footerHeight} = useShellLayout()
  const {isWithinSplitView} = useIsWithinSplitView()
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const {isWithinDialog} = useDialogContext()
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)
  const centerOnIPad = shouldCenterNativeTabletContent({
    isIPad: IS_IPAD,
    gtMobile,
    isWithinDialog,
    isWithinSplitView,
    isWithinOffsetView,
  })
  const isWithinContainedTabletSurface =
    IS_IPAD && (isWithinDialog || isWithinSplitView || isWithinOffsetView)
  const offsetContext = useMemo(() => ({isWithinOffsetView: true}), [])

  // note - if we ever make the footer transparent in any way,
  // we'll need to change this to use contentInsets/scrollIndicatorInsets
  // on iOS and contentContainerStyle padding on Android -sfn
  const animatedStyle = useAnimatedStyle(() => {
    return {
      marginBottom: footerHeight.get(),
    }
  })

  const scrollView = (
    <Animated.ScrollView
      ref={ref}
      id="content"
      centerContent={centerOnIPad ? false : centerContent}
      automaticallyAdjustsScrollIndicatorInsets={
        automaticallyAdjustsScrollIndicatorInsets ??
        (isWithinContainedTabletSurface ? undefined : false)
      }
      indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
      style={[
        a.w_full,
        animatedStyle,
        isWithinSplitView &&
          web({
            flex: 1,
            overflowY: 'scroll',
            scrollbarWidth: 'thin',
            scrollbarColor: `${t.palette.contrast_100} transparent`,
          }),
        style,
      ]}
      contentContainerStyle={[
        centerOnIPad && {
          width: '100%',
          maxWidth: CENTER_COLUMN_WIDTH,
          alignSelf: 'center',
          transform: [
            {
              translateX:
                centerColumnOffset && !ignoreTabletLayoutOffset
                  ? CENTER_COLUMN_OFFSET
                  : 0,
            },
          ],
        },
        /* UIKit centering would also add horizontal insets to the column. */
        centerOnIPad && centerContent && [a.flex_grow, a.justify_center],
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

  return IS_WEB ? (
    scrollView
  ) : (
    <ScrollbarOffsetContext.Provider value={offsetContext}>
      {scrollView}
    </ScrollbarOffsetContext.Provider>
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
  const {isWithinSplitView} = useIsWithinSplitView()
  const ctx = useMemo(() => ({isWithinOffsetView: true}), [])
  return (
    <View
      style={[
        a.w_full,
        !isWithinSplitView && a.mx_auto,
        gtMobile && {
          maxWidth: CENTER_COLUMN_WIDTH,
        },
        !isWithinOffsetView &&
          !isWithinSplitView && {
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

const NativeCenterBorders = memo(function LayoutNativeCenterBorders() {
  const t = useTheme()
  const {centerColumnOffset} = useLayoutBreakpoints()
  return (
    <View
      pointerEvents="none"
      style={[
        a.absolute,
        a.top_0,
        a.bottom_0,
        a.border_l,
        a.border_r,
        t.atoms.border_contrast_low,
        {
          alignSelf: 'center',
          width: CENTER_COLUMN_WIDTH + 2,
          transform: [
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0},
          ],
          zIndex: 1,
        },
      ]}
    />
  )
})
