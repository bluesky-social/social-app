import React, {startTransition} from 'react'
import {FlatListProps} from 'react-native'
import {FlatList_INTERNAL} from './Views'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {runOnJS, useSharedValue} from 'react-native-reanimated'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  'onScroll' // Use ScrollContext instead.
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

function ListImpl<ItemT>(
  {onScrolledDownChange, ...props}: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const isScrolledDown = useSharedValue(false)
  const contextScrollHandlers = useScrollHandlers()

  function handleScrolledDownChange(didScrollDown: boolean) {
    startTransition(() => {
      onScrolledDownChange?.(didScrollDown)
    })
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
      if (
        isScrolledDown.value !== didScrollDown &&
        onScrolledDownChange != null
      ) {
        isScrolledDown.value = didScrollDown
        runOnJS(handleScrolledDownChange)(didScrollDown)
      }
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
