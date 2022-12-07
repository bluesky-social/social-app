import React, {useEffect, useState, useMemo} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {Selector} from './Selector'
import {HorzSwipe} from './gestures/HorzSwipe'
import {useAnimatedValue} from '../../lib/useAnimatedValue'
import {useStores} from '../../../state'

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
  onSelectView,
  onRefresh,
  onEndReached,
}: {
  sections: string[]
  items: any[]
  refreshing?: boolean
  swipeEnabled?: boolean
  renderHeader?: () => JSX.Element
  renderItem: (item: any) => JSX.Element
  onSelectView?: (viewIndex: number) => void
  onRefresh?: () => void
  onEndReached?: (info: {distanceFromEnd: number}) => void
}) {
  const store = useStores()
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
    store.shell.setViewControllingSwipes(
      Boolean(swipeEnabled) && selectedIndex > 0,
    )
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
      panX={panX}
      swipeEnabled={swipeEnabled || false}
      canSwipeLeft={selectedIndex > 0}
      canSwipeRight={selectedIndex < sections.length - 1}
      onSwipeEnd={onSwipeEnd}>
      <FlatList
        data={data}
        keyExtractor={item => item._reactKey}
        renderItem={renderItemInternal}
        stickyHeaderIndices={STICKY_HEADER_INDICES}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
      />
    </HorzSwipe>
  )
}

const styles = StyleSheet.create({})
