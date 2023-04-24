import React, {ComponentProps} from 'react'
import {observer} from 'mobx-react-lite'
import {Animated, StyleSheet, TouchableWithoutFeedback} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {gradients} from 'lib/styles'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useStores} from 'state/index'
import {isMobileWeb} from 'platform/detection'

export interface FABProps
  extends ComponentProps<typeof TouchableWithoutFeedback> {
  testID?: string
  icon: JSX.Element
}

export const FABInner = observer(({testID, icon, ...props}: FABProps) => {
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
    <TouchableWithoutFeedback testID={testID} {...props}>
      <Animated.View
        style={[styles.outer, isMobileWeb && styles.mobileWebOuter, transform]}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.inner}>
          {icon}
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    zIndex: 1,
    right: 28,
    bottom: 94,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  mobileWebOuter: {
    bottom: 114,
  },
  inner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
