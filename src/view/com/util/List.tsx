import React, {memo} from 'react'
import {FlatListProps, RefreshControl, ViewToken} from 'react-native'
import {runOnJS, useSharedValue} from 'react-native-reanimated'
import {updateActiveVideoViewAsync} from '@haileyok/bluesky-video'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {addStyle} from '#/lib/styles'
import {isIOS} from '#/platform/detection'
import {useLightbox} from '#/state/lightbox'
import {useTheme} from '#/alf'
import {FlatList_INTERNAL} from './Views'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  | 'onMomentumScrollBegin' // Use ScrollContext instead.
  | 'onMomentumScrollEnd' // Use ScrollContext instead.
  | 'onScroll' // Use ScrollContext instead.
  | 'onScrollBeginDrag' // Use ScrollContext instead.
  | 'onScrollEndDrag' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
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
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

function ListImpl<ItemT>(
  {
    onScrolledDownChange,
    refreshing,
    onRefresh,
    onItemSeen,
    headerOffset,
    style,
    progressViewOffset,
    ...props
  }: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const isScrolledDown = useSharedValue(false)
  const t = useTheme()
  const dedupe = useDedupe(400)
  const {activeLightbox} = useLightbox()

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

      if (isIOS) {
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
      (info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>}) => {
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
      {...props}
      scrollIndicatorInsets={{right: 1}}
      contentOffset={contentOffset}
      refreshControl={refreshControl}
      onScroll={scrollHandler}
      scrollsToTop={!activeLightbox}
      scrollEventThrottle={1}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      style={style}
      ref={ref}
    />
  )
}

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement
