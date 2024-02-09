import React, {useRef, useMemo, useEffect, useState, useCallback} from 'react'
import {StyleSheet, View, ScrollView, LayoutChangeEvent} from 'react-native'
import {Text} from '../util/text/Text'
import {PressableWithHover} from '../util/PressableWithHover'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isWeb} from 'platform/detection'
import {DraggableScrollView} from './DraggableScrollView'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: (index: number) => void
}

export function TabBar({
  testID,
  selectedPage,
  items,
  indicatorColor,
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const pal = usePalette('default')
  const scrollElRef = useRef<ScrollView>(null)
  const [itemXs, setItemXs] = useState<number[]>([])
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: indicatorColor || pal.colors.link}),
    [indicatorColor, pal],
  )
  const {isDesktop, isTablet} = useWebMediaQueries()

  // scrolls to the selected item when the page changes
  useEffect(() => {
    scrollElRef.current?.scrollTo({
      x: itemXs[selectedPage] || 0,
    })
  }, [scrollElRef, itemXs, selectedPage])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  // calculates the x position of each item on mount and on layout change
  const onItemLayout = React.useCallback(
    (e: LayoutChangeEvent, index: number) => {
      const x = e.nativeEvent.layout.x
      setItemXs(prev => {
        const Xs = [...prev]
        Xs[index] = x
        return Xs
      })
    },
    [],
  )

  const styles = isDesktop || isTablet ? desktopStyles : mobileStyles

  return (
    <View testID={testID} style={[pal.view, styles.outer]}>
      <DraggableScrollView
        testID={`${testID}-selector`}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}>
        {items.map((item, i) => {
          const selected = i === selectedPage
          return (
            <PressableWithHover
              testID={`${testID}-selector-${i}`}
              key={`${item}-${i}`}
              onLayout={e => onItemLayout(e, i)}
              style={[styles.item, selected && indicatorStyle]}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}>
              <Text
                type={isDesktop || isTablet ? 'xl-bold' : 'lg-bold'}
                testID={testID ? `${testID}-${item}` : undefined}
                style={selected ? pal.text : pal.textLight}>
                {item}
              </Text>
            </PressableWithHover>
          )
        })}
      </DraggableScrollView>
    </View>
  )
}

const desktopStyles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    width: 598,
  },
  contentContainer: {
    columnGap: 8,
    marginLeft: 14,
    paddingRight: 14,
    backgroundColor: 'transparent',
  },
  item: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
})

const mobileStyles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
  },
  contentContainer: {
    columnGap: isWeb ? 0 : 20,
    marginLeft: isWeb ? 0 : 18,
    paddingRight: isWeb ? 0 : 36,
    backgroundColor: 'transparent',
  },
  item: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: isWeb ? 8 : 0,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
})
