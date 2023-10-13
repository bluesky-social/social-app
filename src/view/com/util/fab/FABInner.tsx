import React, {ComponentProps} from 'react'
import {observer} from 'mobx-react-lite'
import {autorun} from 'mobx'
import {Animated, StyleSheet, TouchableWithoutFeedback} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {gradients} from 'lib/styles'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useStores} from 'state/index'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lib/numbers'

export interface FABProps
  extends ComponentProps<typeof TouchableWithoutFeedback> {
  testID?: string
  icon: JSX.Element
}

export const FABInner = observer(function FABInnerImpl({
  testID,
  icon,
  ...props
}: FABProps) {
  const insets = useSafeAreaInsets()
  const {isTablet} = useWebMediaQueries()
  const store = useStores()
  const interp = useAnimatedValue(0)
  React.useEffect(() => {
    return autorun(() => {
      Animated.timing(interp, {
        toValue: store.shell.minimalShellMode ? 0 : 1,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    })
  }, [interp, store])
  const transform = isTablet
    ? undefined
    : {
        transform: [{translateY: Animated.multiply(interp, -44)}],
      }
  const size = isTablet ? styles.sizeLarge : styles.sizeRegular
  const right = isTablet ? 50 : 24
  const bottom = isTablet ? 50 : clamp(insets.bottom, 15, 60) + 15
  return (
    <TouchableWithoutFeedback testID={testID} {...props}>
      <Animated.View style={[styles.outer, size, {right, bottom}, transform]}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.inner, size]}>
          {icon}
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  sizeRegular: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sizeLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  outer: {
    position: 'absolute',
    zIndex: 1,
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
