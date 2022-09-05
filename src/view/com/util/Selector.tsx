import React, {useState} from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {colors} from '../../lib/styles'

export interface SelectorItem {
  label: string
}

export function Selector({
  style,
  items,
  onSelect,
}: {
  style?: StyleProp<ViewStyle>
  items: SelectorItem[]
  onSelect?: (index: number) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const onPressItem = (index: number) => {
    setSelectedIndex(index)
    onSelect?.(index)
  }

  return (
    <View style={[styles.outer, style]}>
      {items.map((item, i) => {
        const selected = i === selectedIndex
        return (
          <TouchableWithoutFeedback key={i} onPress={() => onPressItem(i)}>
            <View style={selected ? styles.itemSelected : styles.item}>
              <Text style={selected ? styles.labelSelected : styles.label}>
                {item.label}
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
    paddingHorizontal: 14,
  },
  item: {
    paddingBottom: 12,
    marginRight: 20,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.gray5,
  },
  itemSelected: {
    paddingBottom: 8,
    marginRight: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.purple3,
  },
  labelSelected: {
    fontWeight: '600',
    fontSize: 16,
  },
})
