import React, {useState, useCallback} from 'react'
import {FlatList} from '../util/Views'
import {RefreshControl, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {clamp} from 'lib/numbers'
import {Selector} from '../util/ViewSelector'
import {HEADER_ITEM, SELECTOR_ITEM, ContainerProps, TabProps} from './types'
import {useTabOptions, useTabbedUIState} from './hooks'
import {isAndroid} from 'platform/detection'
import {s} from 'lib/styles'

// NOTE sticky header disabled on android due to major performance issues -prf
const STICKY_HEADER_INDICES = isAndroid ? undefined : [1]

export type TabsContainerHandle = {
  scrollToTop: () => void
}

export const Tab = (_props: TabProps) => {
  return <></>
}

// FIXME(prf): Figure out why the false positives
/* eslint-disable react/prop-types */

export const TabsContainer = React.forwardRef<
  TabsContainerHandle,
  ContainerProps
>(function TabsContainer({children, renderHeader, onSelectTab, onScroll}, ref) {
  const pal = usePalette('default')
  const [tabOptions, tabNames] = useTabOptions(children)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const selectedTabOptions = tabOptions[selectedIndex]
  const [data, renderItem] = useTabbedUIState(selectedTabOptions)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const flatListRef = React.useRef<FlatList>(null)

  // events
  // =

  const keyExtractor = useCallback((item: any) => item._reactKey, [])

  const onPressSelection = useCallback(
    (index: number) => {
      index = clamp(index, 0, tabNames.length)
      setSelectedIndex(index)
      onSelectTab?.(index)
    },
    [setSelectedIndex, tabNames, onSelectTab],
  )

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({offset: 0})
    },
  }))

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await selectedTabOptions.onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }, [selectedTabOptions, setIsRefreshing])

  // rendering
  // =

  const renderItemInternal = useCallback(
    ({item}: {item: any}) => {
      if (item === HEADER_ITEM) {
        if (renderHeader) {
          return renderHeader()
        }
        return <View />
      } else if (item === SELECTOR_ITEM) {
        return (
          <Selector
            items={tabNames}
            selectedIndex={selectedIndex}
            onSelect={onPressSelection}
          />
        )
      } else {
        return renderItem(item)
      }
    },
    [tabNames, selectedIndex, onPressSelection, renderHeader, renderItem],
  )

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItemInternal}
      stickyHeaderIndices={STICKY_HEADER_INDICES}
      onScroll={onScroll}
      onEndReached={tabOptions[selectedIndex].onEndReached}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
        />
      }
      onEndReachedThreshold={0.6}
      contentContainerStyle={s.contentContainer}
      removeClippedSubviews={true}
      scrollIndicatorInsets={{right: 1}} // fixes a bug where the scroll indicator is on the middle of the screen https://github.com/bluesky-social/social-app/pull/464
    />
  )
})
