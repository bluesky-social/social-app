import React, {memo} from 'react'
import {FlatListProps, RefreshControl} from 'react-native'
import {FlatList_INTERNAL} from './Views'
import {addStyle} from 'lib/styles'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {runOnJS, useSharedValue} from 'react-native-reanimated'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {usePalette} from '#/lib/hooks/usePalette'

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
    />
  )
}

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement
