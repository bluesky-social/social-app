import {forwardRef, useMemo} from 'react'
import {type FlatList, type FlatListProps, type ViewToken} from 'react-native'
import Animated, {
  type FlatListPropsWithLayout,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'

import {useLightbox} from '#/state/lightbox'
import {atoms as a, useTheme, web} from '#/alf'
import {useListScrollContext} from '#/components/List/ListScrollProvider'

export {
  ListScrollProvider,
  useListScrollHandler,
} from '#/components/List/ListScrollProvider'

/**
 * Cleaned up FlatList without some problematic props.
 *
 *   - `contentOffset` - Use `headerOffset` or `footerOffset`
 */
type ListProps<Item> = Omit<FlatListProps<Item>, 'contentOffset'> & {
  /**
   * Wrapper around `onViewableItemsChanged` that calls back with individual
   * items IF they `item.isViewable` is true.
   */
  onItemSeen?: (item: Item) => void
  /**
   * Sugar for adding padding to the top of the list to accommodate fixed
   * headers. Also applies insets to the scroll indicators.
   */
  headerOffset?: number
  /**
   * Sugar for adding padding to the bottom of the list to accommodate fixed
   * footers. Also applies insets to the scroll indicators.
   */
  footerOffset?: number
}

export const List = forwardRef(function List<Item>(
  props: ListProps<Item>,
  ref: React.Ref<FlatList<Item>>,
) {
  const t = useTheme()
  const {activeLightbox} = useLightbox()
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

  const [onViewableItemsChanged, viewabilityConfig] = useMemo(() => {
    const onItemSeen = props.onItemSeen
    if (!onItemSeen) return [undefined, undefined]
    return [
      (info: {
        viewableItems: Array<ViewToken<Item>>
        changed: Array<ViewToken<Item>>
      }) => {
        for (const item of info.changed) {
          if (item.isViewable) {
            onItemSeen(item.item)
          }
        }
      },
      {
        itemVisiblePercentThreshold: 40,
        minimumViewTime: 0.5e3,
      },
    ]
  }, [props.onItemSeen])

  return (
    <Animated.FlatList
      ref={ref}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      /**
       * iOS automatically adds in the safe area to the scroll indicator
       * insets, even though the overwhelming majority of our ScrollViews do
       * not stretch from edge to edge.
       * @see https://github.com/bluesky-social/social-app/pull/7131
       */
      automaticallyAdjustsScrollIndicatorInsets={false}
      /**
       * For better UX, we default to true, but it can be disabled if needed.
       * @see https://github.com/bluesky-social/social-app/pull/8529
       */
      showsVerticalScrollIndicator
      indicatorStyle={t.name === 'light' ? 'black' : 'white'}
      scrollIndicatorInsets={{
        top: props.headerOffset ?? 0,
        bottom: props.footerOffset ?? 0,
        /**
         * May fix a bug where the scroll indicator is in the middle of the screen
         * @see https://github.com/facebook/react-native/issues/26610
         */
        right: 1,
      }}
      /**
       * iOS-only, should match `scrollIndicatorInsets`
       * @see https://reactnative.dev/docs/scrollview#contentinset-ios
       */
      contentInset={{
        top: props.headerOffset ?? 0,
        bottom: props.footerOffset ?? 0,
      }}
      /**
       * Native only. On web, we use padding on `style` instead.
       */
      contentOffset={
        props.headerOffset ? {x: 0, y: props.headerOffset * -1} : undefined
      }
      scrollsToTop={!activeLightbox}
      {...(props as FlatListPropsWithLayout<Item>)}
      style={[
        /*
         * On web, the List should always fill its container, otherwise
         * `onScroll` will not work due to the entire page scrolling.
         */
        web([
          a.h_full,
          {
            paddingTop: props.headerOffset,
            paddingBottom: props.footerOffset,
          },
        ]),
      ]}
      onScroll={onScroll}
    />
  )
}) as <Item>(
  props: ListProps<Item> & {ref?: React.Ref<FlatList<Item>>},
) => React.ReactElement
