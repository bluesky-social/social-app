import React, {useEffect} from 'react'
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {useAnimatedValue} from '../../lib/useAnimatedValue'
import {Text} from '../util/Text'
import {colors} from '../../lib/styles'

interface AutocompleteItem {
  handle: string
  displayName?: string
}

export function Autocomplete({
  active,
  items,
  onSelect,
}: {
  active: boolean
  items: AutocompleteItem[]
  onSelect: (item: string) => void
}) {
  const winDim = useWindowDimensions()
  const positionInterp = useAnimatedValue(0)

  useEffect(() => {
    Animated.timing(positionInterp, {
      toValue: active ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [positionInterp, active])

  const topAnimStyle = {
    top: positionInterp.interpolate({
      inputRange: [0, 1],
      outputRange: [winDim.height, winDim.height / 4],
    }),
  }
  return (
    <Animated.View style={[styles.outer, topAnimStyle]}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.item}
          onPress={() => onSelect(item.handle)}>
          <Text style={styles.itemText}>@{item.handle}</Text>
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
