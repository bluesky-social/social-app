import React from 'react'
import {TouchableOpacity, StyleSheet, View} from 'react-native'
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

  if (!active) {
    return <View />
  }
  return (
    <View style={[styles.outer, pal.view, pal.border]}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderWidth: 1,
    borderRadius: 8,
  },
  item: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
})
