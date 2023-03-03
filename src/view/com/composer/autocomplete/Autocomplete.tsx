import React, {useEffect} from 'react'
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../../util/text/Text'

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
  const pal = usePalette('default')
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
    <Animated.View style={[styles.outer, pal.view, pal.border, topAnimStyle]}>
      {items.map((item, i) => (
        <TouchableOpacity
          testID="autocompleteButton"
          key={i}
          style={[pal.border, styles.item]}
          onPress={() => onSelect(item.handle)}>
          <Text type="md-medium" style={pal.text}>
            {item.displayName || item.handle}
            <Text type="sm" style={pal.textLight}>
              &nbsp;@{item.handle}
            </Text>
          </Text>
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
    borderTopWidth: 1,
  },
  item: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
})
