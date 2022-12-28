// TODO: replaceme with something in the design system

import React, {useRef} from 'react'
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import RootSiblings from 'react-native-root-siblings'
import {Text} from './text/Text'
import {colors} from '../../lib/styles'

interface PickerItem {
  value: string
  label: string
}

interface PickerOpts {
  style?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  iconStyle?: FontAwesomeIconStyle
  items: PickerItem[]
  value: string
  onChange: (value: string) => void
  enabled?: boolean
}

const MENU_WIDTH = 200

export function Picker({
  style,
  labelStyle,
  iconStyle,
  items,
  value,
  onChange,
  enabled,
}: PickerOpts) {
  const ref = useRef<View>(null)
  const valueLabel = items.find(item => item.value === value)?.label || value
  const onPress = () => {
    if (!enabled) {
      return
    }
    ref.current?.measure(
      (
        _x: number,
        _y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => {
        createDropdownMenu(pageX, pageY + height, MENU_WIDTH, items, onChange)
      },
    )
  }
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.outer, style]} ref={ref}>
        <View style={styles.label}>
          <Text style={labelStyle}>{valueLabel}</Text>
        </View>
        <FontAwesomeIcon icon="angle-down" style={[styles.icon, iconStyle]} />
      </View>
    </TouchableWithoutFeedback>
  )
}

function createDropdownMenu(
  x: number,
  y: number,
  width: number,
  items: PickerItem[],
  onChange: (value: string) => void,
): RootSiblings {
  const onPressItem = (index: number) => {
    sibling.destroy()
    onChange(items[index].value)
  }
  const onOuterPress = () => sibling.destroy()
  const sibling = new RootSiblings(
    (
      <>
        <TouchableWithoutFeedback onPress={onOuterPress}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <View style={[styles.menu, {left: x, top: y, width}]}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index !== 0 && styles.menuItemBorder]}
              onPress={() => onPressItem(index)}>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
  )
  return sibling
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 5,
  },
  icon: {},
  bg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000',
    opacity: 0.1,
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 14,
    opacity: 1,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 15,
    paddingRight: 30,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    marginTop: 4,
    paddingTop: 12,
  },
  menuItemIcon: {
    marginLeft: 6,
    marginRight: 8,
  },
  menuItemLabel: {
    fontSize: 15,
  },
})
