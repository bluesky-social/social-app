import React, {useEffect} from 'react'
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'

export const Autocomplete = observer(
  ({
    view,
    onSelect,
  }: {
    view: UserAutocompleteViewModel
    onSelect: (item: string) => void
  }) => {
    const pal = usePalette('default')
    const winDim = useWindowDimensions()
    const positionInterp = useAnimatedValue(0)

    useEffect(() => {
      Animated.timing(positionInterp, {
        toValue: view.isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start()
    }, [positionInterp, view.isActive])

    const topAnimStyle = {
      top: positionInterp.interpolate({
        inputRange: [0, 1],
        outputRange: [winDim.height, winDim.height / 4],
      }),
    }
    return (
      <Animated.View style={[styles.outer, pal.view, pal.border, topAnimStyle]}>
        {view.suggestions.map(item => (
          <TouchableOpacity
            testID="autocompleteButton"
            key={item.handle}
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
  },
)

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
    height: 50,
  },
})
