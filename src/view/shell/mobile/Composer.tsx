import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated'
import {ComposePost} from '../../com/composer/ComposePost'
import {ComposerOpts} from '../../../state/models/shell-ui'

export const Composer = observer(
  ({
    active,
    winHeight,
    replyTo,
    onPost,
    onClose,
  }: {
    active: boolean
    winHeight: number
    replyTo?: ComposerOpts['replyTo']
    onPost?: ComposerOpts['onPost']
    onClose: () => void
  }) => {
    const initInterp = useSharedValue<number>(0)

    useEffect(() => {
      if (active) {
        initInterp.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.exp),
        })
      } else {
        initInterp.value = 0
      }
    }, [initInterp, active])
    const wrapperAnimStyle = useAnimatedStyle(() => ({
      top: interpolate(initInterp.value, [0, 1.0], [winHeight, 0]),
    }))

    // events
    // =

    // rendering
    // =

    if (!active) {
      return <View />
    }

    return (
      <Animated.View style={[styles.wrapper, wrapperAnimStyle]}>
        <ComposePost replyTo={replyTo} onPost={onPost} onClose={onClose} />
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    paddingTop: 24,
  },
})
