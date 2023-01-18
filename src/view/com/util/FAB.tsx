import React from 'react'
import {observer} from 'mobx-react-lite'
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
import {useStores} from '../../../state'

type OnPress = ((event: GestureResponderEvent) => void) | undefined
export const FAB = observer(
  ({icon, onPress}: {icon: IconProp; onPress: OnPress}) => {
    const store = useStores()
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View
          style={[
            styles.outer,
            store.shell.minimalShellMode ? styles.lower : undefined,
          ]}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
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
  },
)

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    zIndex: 1,
    right: 22,
    bottom: 84,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
  },
  lower: {
    bottom: 34,
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
