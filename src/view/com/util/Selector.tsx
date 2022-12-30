import React, {createRef, useState, useMemo} from 'react'
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {Text} from './text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

interface Layout {
  x: number
  width: number
}

export function Selector({
  selectedIndex,
  items,
  panX,
  onSelect,
}: {
  selectedIndex: number
  items: string[]
  panX: Animated.Value
  onSelect?: (index: number) => void
}) {
  const pal = usePalette('default')
  const [itemLayouts, setItemLayouts] = useState<undefined | Layout[]>(
    undefined,
  )
  const itemRefs = useMemo(
    () => Array.from({length: items.length}).map(() => createRef<View>()),
    [items.length],
  )

  const currentLayouts = useMemo(() => {
    const left = itemLayouts?.[selectedIndex - 1] || {x: 0, width: 0}
    const middle = itemLayouts?.[selectedIndex] || {x: 0, width: 0}
    const right = itemLayouts?.[selectedIndex + 1] || {
      x: middle.x + 20,
      width: middle.width,
    }
    return [left, middle, right]
  }, [selectedIndex, items, itemLayouts])

  const underlineStyle = {
    backgroundColor: pal.colors.text,
    left: panX.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [
        currentLayouts[0].x,
        currentLayouts[1].x,
        currentLayouts[2].x,
      ],
    }),
    width: panX.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [
        currentLayouts[0].width,
        currentLayouts[1].width,
        currentLayouts[2].width,
      ],
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
        const selected = i === selectedIndex
        return (
          <TouchableWithoutFeedback key={i} onPress={() => onPressItem(i)}>
            <View style={styles.item} ref={itemRefs[i]}>
              <Text
                style={
                  selected
                    ? [styles.labelSelected, pal.text]
                    : [styles.label, pal.textLight]
                }>
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
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 14,
  },
  item: {
    marginRight: 14,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    height: 4,
    bottom: 0,
  },
})
