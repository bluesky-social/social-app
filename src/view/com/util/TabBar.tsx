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

export function TabBar({
  selectedPage,
  items,
  position,
  offset,
  onSelect,
}: {
  selectedPage: number
  items: string[]
  position: Animated.Value
  offset: Animated.Value
  onSelect?: (index: number) => void
}) {
  const pal = usePalette('default')
  const [itemLayouts, setItemLayouts] = useState<Layout[]>(
    items.map(() => ({x: 0, width: 0})),
  )
  const itemRefs = useMemo(
    () => Array.from({length: items.length}).map(() => createRef<View>()),
    [items.length],
  )
  const panX = Animated.add(position, offset)

  const underlineStyle = {
    backgroundColor: pal.colors.link,
    left: panX.interpolate({
      inputRange: items.map((_item, i) => i),
      outputRange: itemLayouts.map(l => l.x),
    }),
    width: panX.interpolate({
      inputRange: items.map((_item, i) => i),
      outputRange: itemLayouts.map(l => l.width),
    }),
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
  }

  return (
    <View style={[pal.view, styles.outer]} onLayout={onLayout}>
      <Animated.View style={[styles.underline, underlineStyle]} />
      {items.map((item, i) => {
        const selected = i === selectedPage
        return (
          <TouchableWithoutFeedback key={i} onPress={() => onPressItem(i)}>
            <View style={styles.item} ref={itemRefs[i]}>
              <Text
                type="xl-medium"
                style={selected ? pal.text : pal.textLight}>
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
  item: {
    paddingTop: 6,
    paddingBottom: 14,
    marginRight: 24,
  },
  underline: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    borderRadius: 4,
  },
})
