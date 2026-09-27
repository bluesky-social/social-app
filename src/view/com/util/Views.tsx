import {forwardRef, memo, useContext} from 'react'
import {StyleSheet, View, type ViewProps} from 'react-native'
import Animated from 'react-native-reanimated'

import {useIsWithinSplitView} from '#/screens/Messages/components/splitView/context'
import {useBreakpoints, useLayoutBreakpoints, useTheme} from '#/alf'
import {shouldCenterNativeTabletContent} from '#/alf/breakpoints.shared'
import {useDialogContext} from '#/components/Dialog/context'
import {
  CENTER_COLUMN_OFFSET,
  CENTER_COLUMN_WIDTH,
} from '#/components/Layout/const'
import {ScrollbarOffsetContext} from '#/components/Layout/context'
import {IS_IPAD} from '#/env'

const CENTERED_VIEW_OFFSET_CONTEXT = {isWithinOffsetView: true}

// If you explode these into functions, don't forget to forwardRef!

/**
 * Avoid using `FlatList_INTERNAL` and use `List` where possible.
 * The types are a bit wrong on `FlatList_INTERNAL`
 */
export const FlatList_INTERNAL = memo(Animated.FlatList)
export type FlatList_INTERNAL = React.ComponentRef<typeof Animated.FlatList>

/**
 * @deprecated use `Layout` components
 */
export const ScrollView = Animated.ScrollView
export type ScrollView = React.ComponentRef<typeof Animated.ScrollView>

/**
 * @deprecated use `Layout` components
 */
export const CenteredView = forwardRef<
  React.ComponentRef<typeof View>,
  React.PropsWithChildren<
    ViewProps & {sideBorders?: boolean; topBorder?: boolean}
  >
>(function CenteredView(props, ref) {
  const {style, sideBorders, topBorder, ...rest} = props
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const {isWithinDialog} = useDialogContext()
  const {isWithinSplitView} = useIsWithinSplitView()
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)
  const centerOnIPad = shouldCenterNativeTabletContent({
    isIPad: IS_IPAD,
    gtMobile,
    isWithinDialog,
    isWithinSplitView,
    isWithinOffsetView,
  })
  return (
    <ScrollbarOffsetContext.Provider value={CENTERED_VIEW_OFFSET_CONTEXT}>
      <View
        ref={ref}
        style={[
          style,
          centerOnIPad && {
            width: '100%',
            maxWidth: CENTER_COLUMN_WIDTH,
            alignSelf: 'center',
            transform: [
              {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0},
            ],
          },
          centerOnIPad &&
            sideBorders && [
              {
                borderLeftWidth: StyleSheet.hairlineWidth,
                borderRightWidth: StyleSheet.hairlineWidth,
              },
              t.atoms.border_contrast_low,
            ],
          centerOnIPad &&
            topBorder && [
              {borderTopWidth: StyleSheet.hairlineWidth},
              t.atoms.border_contrast_low,
            ],
        ]}
        {...rest}
      />
    </ScrollbarOffsetContext.Provider>
  )
})
