import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import RootSiblings from 'react-native-root-siblings'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {s, colors} from '../../lib/styles'

export function createLocationMenu(): RootSiblings {
  const onPressItem = (_index: number) => {
    sibling.destroy()
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
            <FontAwesomeIcon style={styles.icon} icon="share" />
            <Text style={styles.label}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem]}
            onPress={() => onPressItem(0)}>
            <FontAwesomeIcon style={styles.icon} icon="link" />
            <Text style={styles.label}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => onPressItem(0)}>
            <FontAwesomeIcon style={styles.icon} icon={['far', 'clone']} />
            <Text style={styles.label}>Duplicate Tab</Text>
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
    right: 4,
    top: 70,
    backgroundColor: '#fff',
    borderRadius: 14,
    opacity: 1,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 30,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray1,
    marginTop: 4,
    paddingTop: 12,
  },
  icon: {
    marginLeft: 6,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
  },
})
