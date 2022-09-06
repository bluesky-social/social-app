import React from 'react'
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import RootSiblings from 'react-native-root-siblings'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AVIS} from '../../lib/assets'
import {s, colors} from '../../lib/styles'

export function createAccountsMenu({
  debug_onPressItem,
}: {
  debug_onPressItem: () => void
}): RootSiblings {
  const onPressItem = (_index: number) => {
    sibling.destroy()
    debug_onPressItem() // TODO
  }
  const onOuterPress = () => sibling.destroy()
  const sibling = new RootSiblings(
    (
      <>
        <TouchableWithoutFeedback onPress={onOuterPress}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <View style={[styles.menu]}>
          <TouchableOpacity
            style={[styles.menuItem]}
            onPress={() => onPressItem(0)}>
            <Image style={styles.avi} source={AVIS['alice.com']} />
            <Text style={[styles.label, s.bold]}>Alice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => onPressItem(0)}>
            <FontAwesomeIcon style={styles.icon} icon="plus" />
            <Text style={styles.label}>New Account</Text>
          </TouchableOpacity>
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
    left: 4,
    top: 70,
    backgroundColor: '#fff',
    borderRadius: 14,
    opacity: 1,
    paddingVertical: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 30,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray1,
  },
  avi: {
    width: 28,
    height: 28,
    marginRight: 8,
    borderRadius: 14,
  },
  icon: {
    marginLeft: 6,
    marginRight: 6,
  },
  label: {
    fontSize: 16,
  },
})
