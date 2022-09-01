import React from 'react'
import {GestureResponderEvent, StyleSheet, TouchableOpacity} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {colors, gradients} from '../../lib/styles'
import * as zIndex from '../../lib/z-index'

type OnPress = ((event: GestureResponderEvent) => void) | undefined
export function FAB({icon, onPress}: {icon: IconProp; onPress: OnPress}) {
  return (
    <TouchableOpacity style={styles.outer} onPress={onPress}>
      <LinearGradient
        colors={[gradients.primary.start, gradients.primary.end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.inner}>
        <FontAwesomeIcon
          size={20}
          icon={icon}
          color={colors.white}
          style={styles.icon}
        />
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    zIndex: zIndex.FAB,
    right: 20,
    bottom: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  inner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {},
})
