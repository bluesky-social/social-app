import React, {useEffect, useState} from 'react'
import {
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  View,
} from 'react-native'
import {Selector} from './Selector'
import {HorzSwipe} from './gestures/HorzSwipe'
import {useAnimatedValue} from '../../lib/useAnimatedValue'
import {OnScrollCb} from '../../lib/useOnMainScroll'

const HEADER_ITEM = {_reactKey: '__header__'}
const SELECTOR_ITEM = {_reactKey: '__selector__'}
const STICKY_HEADER_INDICES = [1]

export function ViewSelector({
  sections,
  items,
  refreshing,
  swipeEnabled,
  renderHeader,
  renderItem,
  ListFooterComponent,
  onSelectView,
  onScroll,
  onRefresh,
  onEndReached,
}: {
  sections: string[]
  items: any[]
  refreshing?: boolean
  swipeEnabled?: boolean
  renderHeader?: () => JSX.Element
  renderItem: (item: any) => JSX.Element
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined
  onSelectView?: (viewIndex: number) => void
  onScroll?: OnScrollCb
  onRefresh?: () => void
  onEndReached?: (info: {distanceFromEnd: number}) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const panX = useAnimatedValue(0)

  // events
  // =

  const onSwipeEnd = (dx: number) => {
    if (dx !== 0) {
      setSelectedIndex(selectedIndex + dx)
    }
  }
  const onPressSelection = (index: number) => setSelectedIndex(index)
  useEffect(() => {
    onSelectView?.(selectedIndex)
  }, [selectedIndex])

  // rendering
  // =

  const renderItemInternal = ({item}: {item: any}) => {
    if (item === HEADER_ITEM) {
      if (renderHeader) {
        return renderHeader()
      }
      return <View />
    } else if (item === SELECTOR_ITEM) {
      return (
        <Selector
          items={sections}
          panX={panX}
          selectedIndex={selectedIndex}
          onSelect={onPressSelection}
        />
      )
    } else {
      return renderItem(item)
    }
  }

  const data = [HEADER_ITEM, SELECTOR_ITEM, ...items]
  return (
    <HorzSwipe
      hasPriority
      panX={panX}
      swipeEnabled={swipeEnabled || false}
      canSwipeLeft={selectedIndex > 0}
      canSwipeRight={selectedIndex < sections.length - 1}
      onSwipeEnd={onSwipeEnd}>
      <FlatList
        data={data}
        keyExtractor={item => item._reactKey}
        renderItem={renderItemInternal}
        ListFooterComponent={ListFooterComponent}
        stickyHeaderIndices={STICKY_HEADER_INDICES}
        refreshing={refreshing}
        onScroll={onScroll}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
      />
    </HorzSwipe>
  )
}
