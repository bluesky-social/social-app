import React, {createRef, useState, useMemo} from 'react'
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {Text} from './text/Text'
import {usePalette} from 'lib/hooks/usePalette'

interface Layout {
  x: number
  width: number
}

export interface TabBarProps {
  selectedPage: number
  items: string[]
  position: Animated.Value
  offset: Animated.Value
  indicatorPosition?: 'top' | 'bottom'
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: () => void
}

export function TabBar({
  selectedPage,
  items,
  position,
  offset,
  indicatorPosition = 'bottom',
  indicatorColor,
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const pal = usePalette('default')
  const [itemLayouts, setItemLayouts] = useState<Layout[]>(
    items.map(() => ({x: 0, width: 0})),
  )
  const itemRefs = useMemo(
    () => Array.from({length: items.length}).map(() => createRef<View>()),
    [items.length],
  )
  const panX = Animated.add(position, offset)

  const indicatorStyle = {
    backgroundColor: indicatorColor || pal.colors.link,
    bottom: indicatorPosition === 'bottom' ? -1 : undefined,
    top: indicatorPosition === 'top' ? -1 : undefined,
    transform: [
      {
        translateX: panX.interpolate({
          inputRange: items.map((_item, i) => i),
          outputRange: itemLayouts.map(l => l.x + l.width / 2),
        }),
      },
      {
        scaleX: panX.interpolate({
          inputRange: items.map((_item, i) => i),
          outputRange: itemLayouts.map(l => l.width),
        }),
      },
    ],
  }

  const onLayout = () => {
    const promises = []
    for (let i = 0; i < items.length; i++) {
      promises.push(
        new Promise<Layout>(resolve => {
          itemRefs[i].current?.measure(
            (x: number, _y: number, width: number) => {
              resolve({x, width})
            },
          )
        }),
      )
    }
    Promise.all(promises).then((layouts: Layout[]) => {
      setItemLayouts(layouts)
    })
  }

  const onPressItem = (index: number) => {
    onSelect?.(index)
    if (index === selectedPage) {
      onPressSelected?.()
    }
  }

  return (
    <View style={[pal.view, styles.outer]} onLayout={onLayout}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {items.map((item, i) => {
        const selected = i === selectedPage
        return (
          <TouchableWithoutFeedback key={i} onPress={() => onPressItem(i)}>
            <View
              style={
                indicatorPosition === 'top' ? styles.itemTop : styles.itemBottom
              }
              ref={itemRefs[i]}>
              <Text type="xl-bold" style={selected ? pal.text : pal.textLight}>
                {item}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  itemTop: {
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 24,
  },
  itemBottom: {
    paddingTop: 8,
    paddingBottom: 12,
    marginRight: 24,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    width: 1,
    height: 3,
    borderRadius: 4,
  },
})
