import {forwardRef, memo} from 'react'
import {View, type ViewProps} from 'react-native'
import Animated from 'react-native-reanimated'

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
  return <View ref={ref} {...props} />
})
