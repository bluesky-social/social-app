import React, {createRef, useState, useMemo} from 'react'
import {StyleSheet, Text, TouchableWithoutFeedback, View} from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated'
import {colors} from '../../lib/styles'

interface Layout {
  x: number
  width: number
}

export function Selector({
  selectedIndex,
  items,
  swipeGestureInterp,
  onSelect,
}: {
  selectedIndex: number
  items: string[]
  swipeGestureInterp: SharedValue<number>
  onSelect?: (index: number) => void
}) {
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
  }, [selectedIndex, itemLayouts])

  const underlinePos = useAnimatedStyle(() => {
    const other =
      swipeGestureInterp.value === 0
        ? currentLayouts[1]
        : swipeGestureInterp.value < 0
        ? currentLayouts[0]
        : currentLayouts[2]
    return {
      left: interpolate(
        Math.abs(swipeGestureInterp.value),
        [0, 1],
        [currentLayouts[1].x, other.x],
      ),
      width: interpolate(
        Math.abs(swipeGestureInterp.value),
        [0, 1],
        [currentLayouts[1].width, other.width],
      ),
    }
  }, [currentLayouts, swipeGestureInterp])

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
    <View style={[styles.outer]} onLayout={onLayout}>
      <Animated.View style={[styles.underline, underlinePos]} />
      {items.map((item, i) => {
        const selected = i === selectedIndex
        return (
          <TouchableWithoutFeedback key={i} onPress={() => onPressItem(i)}>
            <View style={styles.item} ref={itemRefs[i]}>
              <Text style={selected ? styles.labelSelected : styles.itemLabel}>
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
    backgroundColor: colors.white,
  },
  item: {
    marginRight: 20,
    paddingHorizontal: 10,
  },
  itemLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.gray5,
  },
  labelSelected: {
    fontWeight: '600',
    fontSize: 16,
  },
  underline: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.black,
    bottom: 0,
  },
})
