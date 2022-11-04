import React, {useEffect} from 'react'
import {
  useWindowDimensions,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import {colors} from '../../lib/styles'

export function Autocomplete({
  active,
  items,
  onSelect,
}: {
  active: boolean
  items: string[]
  onSelect: (item: string) => void
}) {
  const winDim = useWindowDimensions()
  const positionInterp = useSharedValue<number>(0)

  useEffect(() => {
    if (active) {
      positionInterp.value = withTiming(1, {duration: 250})
    } else {
      positionInterp.value = withTiming(0, {duration: 250})
    }
  }, [positionInterp, active])

  const topAnimStyle = useAnimatedStyle(() => ({
    top: interpolate(
      positionInterp.value,
      [0, 1.0],
      [winDim.height, winDim.height / 4],
    ),
  }))
  return (
    <Animated.View style={[styles.outer, topAnimStyle]}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.item}
          onPress={() => onSelect(item)}>
          <Text style={styles.itemText}>@{item}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
  },
})
