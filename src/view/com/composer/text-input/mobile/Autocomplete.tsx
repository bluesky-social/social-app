import React, {useEffect} from 'react'
import {Animated, TouchableOpacity, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {useGrapheme} from '../hooks/useGrapheme'

export const Autocomplete = observer(function AutocompleteImpl({
  view,
  onSelect,
}: {
  view: UserAutocompleteModel
  onSelect: (item: string) => void
}) {
  const pal = usePalette('default')
  const positionInterp = useAnimatedValue(0)
  const {getGraphemeString} = useGrapheme()

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
    <Animated.View style={topAnimStyle}>
      {view.isActive ? (
        <View style={[pal.view, styles.container, pal.border]}>
          {view.suggestions.length > 0 ? (
            view.suggestions.slice(0, 5).map(item => {
              // Eventually use an average length
              const MAX_CHARS = 40
              const MAX_HANDLE_CHARS = 20

              // Using this approach because styling is not respecting
              // bounding box wrapping (before converting to ellipsis)
              const {name: displayHandle, remainingCharacters} =
                getGraphemeString(item.handle, MAX_HANDLE_CHARS)

              const {name: displayName} = getGraphemeString(
                item.displayName ?? item.handle,
                MAX_CHARS -
                  MAX_HANDLE_CHARS +
                  (remainingCharacters > 0 ? remainingCharacters : 0),
              )

              return (
                <TouchableOpacity
                  testID="autocompleteButton"
                  key={item.handle}
                  style={[pal.border, styles.item]}
                  onPress={() => onSelect(item.handle)}
                  accessibilityLabel={`Select ${item.handle}`}
                  accessibilityHint="">
                  <View style={styles.avatarAndHandle}>
                    <UserAvatar avatar={item.avatar ?? null} size={24} />
                    <Text type="md-medium" style={pal.text}>
                      {displayName}
                    </Text>
                  </View>
                  <Text type="sm" style={pal.textLight} numberOfLines={1}>
                    @{displayHandle}
                  </Text>
                </TouchableOpacity>
              )
            })
          ) : (
            <Text type="sm" style={[pal.text, pal.border, styles.noResults]}>
              No result
            </Text>
          )}
        </View>
      ) : null}
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginLeft: -54,
    top: 10,
    borderTopWidth: 1,
  },
  item: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  avatarAndHandle: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  noResults: {
    paddingVertical: 12,
  },
})
