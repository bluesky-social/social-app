import {Animated, StyleSheet, TouchableWithoutFeedback} from 'react-native'
import React, {ComponentProps} from 'react'
import {colors, gradients} from 'lib/styles'

import LinearGradient from 'react-native-linear-gradient'
import {isMobileWeb} from 'platform/detection'
import {observer} from 'mobx-react-lite'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useStores} from 'state/index'

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
          colors={[colors.splx.primary[40], colors.splx.primary[50]]}
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
    right: 24,
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
