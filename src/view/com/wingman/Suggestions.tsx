import React from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {pressableOpacity} from 'lib/pressableOpacity'
import {s} from 'lib/styles'

export const SuggestionList = function SuggestionList({
  suggestions,
  style,
  onPress,
}: {
  suggestions: string[]
  onPress: (content: string) => void
  style?: StyleProp<ViewStyle>
}) {
  const renderItem = React.useCallback(
    ({item}: ListRenderItemInfo<string>) => {
      return (
        <View style={[styles.itemContainer]}>
          <SuggestionPill text={item} onPress={() => onPress(item)} />
        </View>
      )
    },
    [onPress],
  )

  const renderItemDivider = React.useCallback(() => {
    return <View style={styles.itemDivider} />
  }, [])

  return (
    <FlatList
      horizontal
      data={suggestions}
      renderItem={renderItem}
      keyExtractor={i => i}
      showsHorizontalScrollIndicator={false}
      style={[style]}
      contentContainerStyle={[s.pt5, s.pb5]}
      ItemSeparatorComponent={renderItemDivider}
      keyboardShouldPersistTaps="handled"
    />
  )
}

const SuggestionPill = ({
  text,
  onPress,
}: {
  text: string
  onPress: () => void
}) => {
  const pal = usePalette('inverted')

  return (
    <Pressable
      style={pressableOpacity([pal.view, styles.pillContainer])}
      accessibilityRole="button"
      accessibilityLabel="TODO"
      accessibilityHint="TODO"
      onPress={onPress}>
      <Text style={[pal.text]}>{text}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  itemContainer: {justifyContent: 'center'},
  pillContainer: {
    height: 37,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // TODO: have it in colors
  },
  itemDivider: {
    width: 8,
  },
})
