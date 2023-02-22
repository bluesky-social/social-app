import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {colors, gradients} from 'lib/styles'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useStores} from 'state/index'

type OnPress = ((event: GestureResponderEvent) => void) | undefined
export const FAB = observer(
  ({
    testID,
    icon,
    onPress,
  }: {
    testID?: string
    icon: IconProp
    onPress: OnPress
  }) => {
    const store = useStores()
    const interp = useAnimatedValue(0)
    React.useEffect(() => {
      Animated.timing(interp, {
        toValue: store.shell.minimalShellMode ? 1 : 0,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }, [interp, store.shell.minimalShellMode])
    const transform = {
      transform: [{translateY: Animated.multiply(interp, 60)}],
    }
    return (
      <TouchableWithoutFeedback testID={testID} onPress={onPress}>
        <Animated.View style={[styles.outer, transform]}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.inner}>
            <FontAwesomeIcon size={24} icon={icon} color={colors.white} />
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>
    )
  },
)

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    zIndex: 1,
    right: 22,
    bottom: 94,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  inner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
