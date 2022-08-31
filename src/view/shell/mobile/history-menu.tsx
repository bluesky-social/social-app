import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import RootSiblings from 'react-native-root-siblings'
import {NavigationTabModel} from '../../../state/models/navigation'

export function createBackMenu(tab: NavigationTabModel): RootSiblings {
  const onPressItem = (index: number) => {
    sibling.destroy()
    tab.goToIndex(index)
  }
  const onOuterPress = () => sibling.destroy()
  const sibling = new RootSiblings(
    (
      <>
        <TouchableWithoutFeedback onPress={onOuterPress}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <View style={[styles.menu, styles.back]}>
          {tab.backTen.map((item, i) => (
            <TouchableOpacity
              key={item.index}
              style={[styles.menuItem, i !== 0 && styles.menuItemBorder]}
              onPress={() => onPressItem(item.index)}>
              <Text>{item.title || item.url}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
  )
  return sibling
}
export function createForwardMenu(tab: NavigationTabModel): RootSiblings {
  const onPressItem = (index: number) => {
    sibling.destroy()
    tab.goToIndex(index)
  }
  const onOuterPress = () => sibling.destroy()
  const sibling = new RootSiblings(
    (
      <>
        <TouchableWithoutFeedback onPress={onOuterPress}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <View style={[styles.menu, styles.forward]}>
          {tab.forwardTen.reverse().map((item, i) => (
            <TouchableOpacity
              key={item.index}
              style={[styles.menuItem, i !== 0 && styles.menuItemBorder]}
              onPress={() => onPressItem(item.index)}>
              <Text>{item.title || item.url}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
  )
  return sibling
}

const styles = StyleSheet.create({
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
    bottom: 80,
    backgroundColor: '#fff',
    borderRadius: 8,
    opacity: 1,
  },
  back: {
    left: 10,
  },
  forward: {
    left: 60,
  },
  menuItem: {
    paddingVertical: 10,
    paddingLeft: 15,
    paddingRight: 30,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
})
