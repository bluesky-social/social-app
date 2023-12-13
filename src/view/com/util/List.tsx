import React, {useState} from 'react'
import {FlatListProps} from 'react-native'
import {FlatList_INTERNAL} from './Views'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {runOnJS} from 'react-native-reanimated'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = FlatListProps<ItemT> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

function ListImpl<ItemT>(
  {onScrolledDownChange, ...props}: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const scrollHandlers = useScrollHandlers()

  function handleScrolledDownChange(didScrollDown: boolean) {
    setIsScrolledDown(didScrollDown)
    onScrolledDownChange?.(didScrollDown)
  }

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e, ctx) {
      scrollHandlers.onBeginDrag?.(e, ctx)
    },
    onEndDrag(e, ctx) {
      scrollHandlers.onEndDrag?.(e, ctx)
    },
    onScroll(e, ctx) {
      const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
      if (isScrolledDown !== didScrollDown) {
        runOnJS(handleScrolledDownChange)(didScrollDown)
      }
      scrollHandlers.onScroll?.(e, ctx)
    },
  })

  return (
    <FlatList_INTERNAL
      {...props}
      onScroll={scrollHandler}
      scrollEventThrottle={1}
      ref={ref}
    />
  )
}

export const List = React.forwardRef(ListImpl) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement
