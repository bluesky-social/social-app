import {forwardRef, useMemo} from 'react'
import {
  type FlatList,
  type FlatListProps,
  RefreshControl,
  type ViewToken,
} from 'react-native'
import Animated, {
  type FlatListPropsWithLayout,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import {updateActiveVideoViewAsync} from '@haileyok/bluesky-video'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {isIOS, isNative} from '#/platform/detection'
import {useLightbox} from '#/state/lightbox'
import {atoms as a, useTheme} from '#/alf'
import {useListScrollContext} from '#/components/List/ListScrollProvider'

export {
  ListScrollProvider,
  useListScrollHandler,
} from '#/components/List/ListScrollProvider'

export type ListRef<Item extends {key: string}> =
  React.MutableRefObject<FlatList<Item> | null>

export type ListItem = {key: string}

export type ListProps<Item extends ListItem> = Omit<
  FlatListProps<Item>,
  | 'onScroll'
  | 'onScrollBeginDrag'
  | 'onScrollEndDrag'
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
  | 'refreshControl'
  | 'contentOffset'
> & {
  /**
   * @deprecated use `ListScrollProvider` handler instead
   */
  onScroll?: FlatListProps<Item>['onScroll']
  /**
   * @deprecated use `ListScrollProvider` handler instead
   */
  onScrollBeginDrag?: FlatListProps<Item>['onScrollBeginDrag']
  /**
   * @deprecated use `ListScrollProvider` handler instead
   */
  onScrollEndDrag?: FlatListProps<Item>['onScrollEndDrag']
  /**
   * @deprecated use `ListScrollProvider` handler instead
   */
  onMomentumScrollBegin?: FlatListProps<Item>['onMomentumScrollBegin']
  /**
   * @deprecated use `ListScrollProvider` handler instead
   */
  onMomentumScrollEnd?: FlatListProps<Item>['onMomentumScrollEnd']
  /**
   * @deprecated pass `refreshing` and `onRefresh` instead to enable
   */
  refreshControl?: FlatListProps<Item>['refreshControl']
  /**
   * @deprecated use `headerOffset` instead
   */
  contentOffset?: FlatListProps<Item>['contentOffset']
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
  /**
   * Configures the point at which `onScrolledDownChange` is called.
   */
  didScrollDownThreshold?: number
  onScrolledDownChange?: (isScrolledDown: boolean) => void
}

export const List = forwardRef(function List<Item extends ListItem>(
  {...props}: ListProps<Item>,
  ref: React.Ref<FlatList<Item>>,
) {
  const t = useTheme()
  const {activeLightbox} = useLightbox()
  const debounce400 = useDedupe(400)
  const isScrolledDown = useSharedValue(false)
  const scrollHandlers = useListScrollContext()
  const onScroll = useAnimatedScrollHandler({
    onScroll(e, ctx) {
      scrollHandlers.onScroll?.(e, ctx)

      const didScrollDown =
        e.contentOffset.y > (props.didScrollDownThreshold ?? 200)
      if (isScrolledDown.get() !== didScrollDown) {
        isScrolledDown.set(didScrollDown)
        if (props.onScrolledDownChange) {
          runOnJS(props.onScrolledDownChange)(didScrollDown)
        }
      }

      if (isIOS) runOnJS(debounce400)(updateActiveVideoViewAsync)
    },
    onBeginDrag(e, ctx) {
      scrollHandlers.onScrollBeginDrag?.(e, ctx)
    },
    onEndDrag(e, ctx) {
      scrollHandlers.onScrollEndDrag?.(e, ctx)
      if (isNative) runOnJS(updateActiveVideoViewAsync)()
    },
    /*
     * Note: adding onMomentumBegin here makes simulator scroll lag on Android.
     * So either don't add it, or figure out why. - sfn
     * TODO
     */
    onMomentumBegin(e, ctx) {
      scrollHandlers.onMomentumScrollBegin?.(e, ctx)
    },
    onMomentumEnd(e, ctx) {
      scrollHandlers.onMomentumScrollEnd?.(e, ctx)
      if (isNative) runOnJS(updateActiveVideoViewAsync)()
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

  let refreshControl
  if (props.refreshing !== undefined || props.onRefresh !== undefined) {
    refreshControl = (
      <RefreshControl
        key={t.atoms.text.color}
        refreshing={props.refreshing ?? false}
        onRefresh={props.onRefresh ?? undefined}
        tintColor={t.atoms.text.color}
        titleColor={t.atoms.text.color}
        progressViewOffset={props.progressViewOffset ?? props.headerOffset}
      />
    )
  }

  /**
   * Web only, provides a handle on the resulting `List` DOM element, which we
   * then use to apply sticky styles to individual list item wrappers.
   */
  const dataSet = props.stickyHeaderIndices?.reduce((ds, i) => {
    return {...ds, [`sticky-header-index-${i}`]: 1}
  }, {})

  return (
    <>
      <Animated.FlatList
        // @ts-ignore
        dataSet={dataSet}
        ref={ref}
        keyExtractor={props.keyExtractor || (i => i.key)}
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
         * Native only. On web, we use padding on `style` instead.
         */
        contentOffset={
          props.headerOffset ? {x: 0, y: props.headerOffset * -1} : undefined
        }
        scrollsToTop={!activeLightbox}
        refreshControl={refreshControl}
        {...(props as FlatListPropsWithLayout<Item>)}
        style={[
          a.h_full,
          {
            paddingTop: props.headerOffset,
            paddingBottom: props.footerOffset,
            transform: 'unset',
          },
          props.style,
        ]}
        onScroll={onScroll}
      />
    </>
  )
}) as <Item extends {key: string}>(
  props: ListProps<Item> & {ref?: React.Ref<FlatList<Item>>},
) => React.ReactElement
