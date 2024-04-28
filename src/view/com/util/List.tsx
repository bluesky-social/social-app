import React, {memo} from 'react'
import {FlatListProps, RefreshControl} from 'react-native'
import {runOnJS, useSharedValue} from 'react-native-reanimated'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {usePalette} from '#/lib/hooks/usePalette'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {useGate} from 'lib/statsig/statsig'
import {addStyle} from 'lib/styles'
import {isWeb} from 'platform/detection'
import {FlatList_INTERNAL} from './Views'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  | 'onScroll' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  headerOffset?: number
  refreshing?: boolean
  onRefresh?: () => void
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

function ListImpl<ItemT>(
  {
    onScrolledDownChange,
    refreshing,
    onRefresh,
    headerOffset,
    style,
    ...props
  }: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const isScrolledDown = useSharedValue(false)
  const contextScrollHandlers = useScrollHandlers()
  const pal = usePalette('default')
  const gate = useGate()

  function handleScrolledDownChange(didScrollDown: boolean) {
    onScrolledDownChange?.(didScrollDown)
  }

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e, ctx) {
      contextScrollHandlers.onBeginDrag?.(e, ctx)
    },
    onEndDrag(e, ctx) {
      contextScrollHandlers.onEndDrag?.(e, ctx)
    },
    onScroll(e, ctx) {
      contextScrollHandlers.onScroll?.(e, ctx)

      const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
      if (isScrolledDown.value !== didScrollDown) {
        isScrolledDown.value = didScrollDown
        if (onScrolledDownChange != null) {
          runOnJS(handleScrolledDownChange)(didScrollDown)
        }
      }
    },
    // Note: adding onMomentumBegin here makes simulator scroll
    // lag on Android. So either don't add it, or figure out why.
    onMomentumEnd(e, ctx) {
      contextScrollHandlers.onMomentumEnd?.(e, ctx)
    },
  })

  let refreshControl
  if (refreshing !== undefined || onRefresh !== undefined) {
    refreshControl = (
      <RefreshControl
        refreshing={refreshing ?? false}
        onRefresh={onRefresh}
        tintColor={pal.colors.text}
        titleColor={pal.colors.text}
        progressViewOffset={headerOffset}
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
      scrollEventThrottle={1}
      style={style}
      ref={ref}
      showsVerticalScrollIndicator={
        isWeb || !gate('hide_vertical_scroll_indicators')
      }
    />
  )
}

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement
