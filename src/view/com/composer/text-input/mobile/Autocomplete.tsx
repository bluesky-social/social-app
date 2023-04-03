import React, {useEffect} from 'react'
import {Animated, TouchableOpacity, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'

export const Autocomplete = observer(
  ({
    view,
    onSelect,
  }: {
    view: UserAutocompleteModel
    onSelect: (item: string) => void
  }) => {
    const pal = usePalette('default')
    const positionInterp = useAnimatedValue(0)

    useEffect(() => {
      Animated.timing(positionInterp, {
        toValue: view.isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }, [positionInterp, view.isActive])

    const topAnimStyle = {
      transform: [
        {
          translateY: positionInterp.interpolate({
            inputRange: [0, 1],
            outputRange: [200, 0],
          }),
        },
      ],
    }
    return (
      <View style={[styles.container, view.isActive && styles.visible]}>
        <Animated.View
          style={[
            styles.animatedContainer,
            pal.view,
            pal.border,
            topAnimStyle,
            view.isActive && styles.visible,
          ]}>
          {view.suggestions.slice(0, 5).map(item => (
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
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    display: 'none',
    height: 250,
  },
  animatedContainer: {
    display: 'none',
    position: 'absolute',
    left: -64,
    right: 0,
    top: 0,
    borderTopWidth: 1,
  },
  visible: {
    display: 'flex',
  },
  item: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 50,
  },
})
