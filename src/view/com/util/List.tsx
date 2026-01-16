import React, {memo} from 'react'
import {RefreshControl, type ViewToken} from 'react-native'
import {
  type FlatListPropsWithLayout,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import {updateActiveVideoViewAsync} from '@haileyok/bluesky-video'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {addStyle} from '#/lib/styles'
import {useLightbox} from '#/state/lightbox'
import {useTheme} from '#/alf'
import {IS_IOS} from '#/env'
import {FlatList_INTERNAL} from './Views'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT = any> = Omit<
  FlatListPropsWithLayout<ItemT>,
  | 'onMomentumScrollBegin' // Use ScrollContext instead.
  | 'onMomentumScrollEnd' // Use ScrollContext instead.
  | 'onScroll' // Use ScrollContext instead.
  | 'onScrollBeginDrag' // Use ScrollContext instead.
  | 'onScrollEndDrag' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
  | 'progressViewOffset' // Can't be an animated value
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  headerOffset?: number
  refreshing?: boolean
  onRefresh?: () => void
  onItemSeen?: (item: ItemT) => void
  desktopFixedHeight?: number | boolean
  // Web only prop to contain the scroll to the container rather than the window
  disableFullWindowScroll?: boolean
  sideBorders?: boolean
  progressViewOffset?: number
}
export type ListRef = React.RefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

let List = React.forwardRef<ListMethods, ListProps>(
  (
    {
      onScrolledDownChange,
      refreshing,
      onRefresh,
      onItemSeen,
      headerOffset,
      style,
      progressViewOffset,
      automaticallyAdjustsScrollIndicatorInsets = false,
      ...props
    },
    ref,
  ): React.ReactElement<any> => {
    const isScrolledDown = useSharedValue(false)
    const t = useTheme()
    const dedupe = useDedupe(400)
    const scrollsToTop = useAllowScrollToTop()

    function handleScrolledDownChange(didScrollDown: boolean) {
      onScrolledDownChange?.(didScrollDown)
    }

    // Intentionally destructured outside the main thread closure.
    // See https://github.com/bluesky-social/social-app/pull/4108.
    const {
      onBeginDrag: onBeginDragFromContext,
      onEndDrag: onEndDragFromContext,
      onScroll: onScrollFromContext,
      onMomentumEnd: onMomentumEndFromContext,
    } = useScrollHandlers()
    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag(e, ctx) {
        onBeginDragFromContext?.(e, ctx)
      },
      onEndDrag(e, ctx) {
        runOnJS(updateActiveVideoViewAsync)()
        onEndDragFromContext?.(e, ctx)
      },
      onScroll(e, ctx) {
        onScrollFromContext?.(e, ctx)

        const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
        if (isScrolledDown.get() !== didScrollDown) {
          isScrolledDown.set(didScrollDown)
          if (onScrolledDownChange != null) {
            runOnJS(handleScrolledDownChange)(didScrollDown)
          }
        }

        if (IS_IOS) {
          runOnJS(dedupe)(updateActiveVideoViewAsync)
        }
      },
      // Note: adding onMomentumBegin here makes simulator scroll
      // lag on Android. So either don't add it, or figure out why.
      onMomentumEnd(e, ctx) {
        runOnJS(updateActiveVideoViewAsync)()
        onMomentumEndFromContext?.(e, ctx)
      },
    })

    const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
      if (!onItemSeen) {
        return [undefined, undefined]
      }
      return [
        (info: {
          viewableItems: Array<ViewToken>
          changed: Array<ViewToken>
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
    }, [onItemSeen])

    let refreshControl
    if (refreshing !== undefined || onRefresh !== undefined) {
      refreshControl = (
        <RefreshControl
          key={t.atoms.text.color}
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
          tintColor={t.atoms.text.color}
          titleColor={t.atoms.text.color}
          progressViewOffset={progressViewOffset ?? headerOffset}
        />
      )
    }

    let contentOffset
    if (headerOffset != null) {
      style = addStyle(style, {
        paddingTop: headerOffset,
      })
      contentOffset = {x: 0, y: headerOffset * -1}
    }

    return (
      <FlatList_INTERNAL
        showsVerticalScrollIndicator // overridable
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        {...props}
        automaticallyAdjustsScrollIndicatorInsets={
          automaticallyAdjustsScrollIndicatorInsets
        }
        scrollIndicatorInsets={{
          top: headerOffset,
          right: 1,
          ...props.scrollIndicatorInsets,
        }}
        indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
        contentOffset={contentOffset}
        refreshControl={refreshControl}
        onScroll={scrollHandler}
        scrollsToTop={scrollsToTop}
        scrollEventThrottle={1}
        style={style}
        // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
        ref={ref}
      />
    )
  },
)
List.displayName = 'List'

List = memo(List)
export {List}

// We only want to use this context value on iOS because the `scrollsToTop` prop is iOS-only
// removing it saves us a re-render on Android
const useAllowScrollToTop = IS_IOS ? useAllowScrollToTopIOS : () => undefined
function useAllowScrollToTopIOS() {
  const {activeLightbox} = useLightbox()
  return !activeLightbox
}
