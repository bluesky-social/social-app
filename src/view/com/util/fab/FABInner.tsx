import React, {ComponentProps} from 'react'
import {observer} from 'mobx-react-lite'
import {TouchableWithoutFeedback} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {gradients} from 'lib/styles'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lib/numbers'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import Animated from 'react-native-reanimated'
import {useStyles} from 'view/nova'

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
  const {isMobile} = useWebMediaQueries()
  const {fabMinimalShellTransform} = useMinimalShellMode()
  const styles = useStyles({
    outer: {
      position: 'absolute',
      z: 1,
      right: 24,
      bottom: clamp(insets.bottom, 15, 60) + 15,
      gtMobile: {
        right: 50,
        bottom: 50,
      },
    },
    sizing: {
      w: 60,
      h: 60,
      radius: 30,
      gtMobile: {
        w: 70,
        h: 70,
        radius: 35,
      },
    },
    inner: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  })

  return (
    <TouchableWithoutFeedback testID={testID} {...props}>
      <Animated.View
        style={[
          styles.outer,
          styles.sizing,
          isMobile && fabMinimalShellTransform,
        ]}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.inner, styles.sizing]}>
          {icon}
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
})
