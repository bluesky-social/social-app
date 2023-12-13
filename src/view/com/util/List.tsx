import React from 'react'
import {FlatListProps} from 'react-native'
import {FlatList_INTERNAL} from './Views'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = FlatListProps<ItemT>
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

function ListImpl<ItemT>(props: ListProps<ItemT>, ref: React.Ref<ListMethods>) {
  return <FlatList_INTERNAL {...props} ref={ref} />
}

export const List = React.forwardRef(ListImpl) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement
