import React, {useState} from 'react'
import {FlatListProps} from 'react-native'
import {FlatList_INTERNAL} from './Views'
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

  // TODO: This ignores the passed-in onScroll completely.
  const scrollHandler = useAnimatedScrollHandler({
    onScroll(e) {
      const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
      if (isScrolledDown !== didScrollDown) {
        setIsScrolledDown(didScrollDown)
        onScrolledDownChange?.(didScrollDown)
      }
    },
  })

  return <FlatList_INTERNAL {...props} onScroll={scrollHandler} ref={ref} />
}

export const List = React.forwardRef(ListImpl) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement
