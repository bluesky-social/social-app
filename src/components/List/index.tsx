import {forwardRef} from 'react'
import {type FlatList, type FlatListProps} from 'react-native'
import Animated, {
  type FlatListPropsWithLayout,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'

import {atoms as a, web} from '#/alf'
import {useListScrollContext} from '#/components/List/ListScrollProvider'

export {
  ListScrollProvider,
  useListScrollHandler,
} from '#/components/List/ListScrollProvider'

/**
 * Cleaned up FlatList without some problematic props.
 *
 *   - `contentOffset` - Doesn't work, use padding on `contentContainerStyle` instead.
 */
type ListProps<Item> = Omit<FlatListProps<Item>, 'contentOffset'>

export const List = forwardRef(function List<Item>(
  props: ListProps<Item>,
  ref: React.Ref<FlatList<Item>>,
) {
  const scrollHandlers = useListScrollContext()
  const onScroll = useAnimatedScrollHandler({
    onScroll(e, ctx) {
      scrollHandlers.onScroll?.(e, ctx)
    },
    onBeginDrag(e, ctx) {
      scrollHandlers.onScrollBeginDrag?.(e, ctx)
    },
    onEndDrag(e, ctx) {
      scrollHandlers.onScrollEndDrag?.(e, ctx)
    },
    onMomentumBegin(e, ctx) {
      scrollHandlers.onMomentumScrollBegin?.(e, ctx)
    },
    /*
     * Note: adding onMomentumBegin here makes simulator scroll lag on Android.
     * So either don't add it, or figure out why. - sfn
     */
    onMomentumEnd(e, ctx) {
      scrollHandlers.onMomentumScrollEnd?.(e, ctx)
    },
  })

  return (
    <Animated.FlatList<Item>
      ref={ref}
      {...(props as FlatListPropsWithLayout<Item>)}
      style={[
        /*
         * On web, the List should always fill its container, otherwise
         * `onScroll` will not work due to the entire page scrolling.
         */
        web(a.h_full),
      ]}
      onScroll={onScroll}
    />
  )
}) as <Item>(
  props: ListProps<Item> & {ref?: React.Ref<FlatList<Item>>},
) => React.ReactElement
