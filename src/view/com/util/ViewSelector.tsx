import React, {useEffect, useState} from 'react'
import {View} from 'react-native'
import {Selector} from './Selector'
import {HorzSwipe} from './gestures/HorzSwipe'
import {FlatList} from './Views'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {clamp} from 'lib/numbers'
import {s} from 'lib/styles'

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

  const onSwipeEnd = React.useCallback(
    (dx: number) => {
      if (dx !== 0) {
        setSelectedIndex(clamp(selectedIndex + dx, 0, sections.length))
      }
    },
    [setSelectedIndex, selectedIndex, sections],
  )
  const onPressSelection = React.useCallback(
    (index: number) => setSelectedIndex(clamp(index, 0, sections.length)),
    [setSelectedIndex, sections],
  )
  useEffect(() => {
    onSelectView?.(selectedIndex)
  }, [selectedIndex, onSelectView])

  // rendering
  // =

  const renderItemInternal = React.useCallback(
    ({item}: {item: any}) => {
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
    },
    [sections, panX, selectedIndex, onPressSelection, renderHeader, renderItem],
  )

  const data = React.useMemo(
    () => [HEADER_ITEM, SELECTOR_ITEM, ...items],
    [items],
  )
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
        onEndReachedThreshold={0.6}
        contentContainerStyle={s.contentContainer}
        removeClippedSubviews={true}
        scrollIndicatorInsets={{right: 1}} // fixes a bug where the scroll indicator is on the middle of the screen https://github.com/bluesky-social/social-app/pull/464
      />
    </HorzSwipe>
  )
}
