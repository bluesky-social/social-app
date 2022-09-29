import React from 'react'
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {colors, gradients} from '../../lib/styles'
import * as zIndex from '../../lib/z-index'

type OnPress = ((event: GestureResponderEvent) => void) | undefined
export function FAB({icon, onPress}: {icon: IconProp; onPress: OnPress}) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.outer}>
        <LinearGradient
          colors={[gradients.primary.start, gradients.primary.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.inner}>
          <FontAwesomeIcon
            size={24}
            icon={icon}
            color={colors.white}
            style={styles.icon}
          />
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    zIndex: zIndex.FAB,
    right: 20,
    bottom: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  inner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {},
})
