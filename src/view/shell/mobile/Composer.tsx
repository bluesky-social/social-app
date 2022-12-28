import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {Animated, Easing, Platform, StyleSheet, View} from 'react-native'
import {ComposePost} from '../../com/composer/ComposePost'
import {ComposerOpts} from '../../../state/models/shell-ui'
import {useAnimatedValue} from '../../lib/hooks/useAnimatedValue'

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
    const initInterp = useAnimatedValue(0)

    useEffect(() => {
      if (active) {
        Animated.timing(initInterp, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start()
      } else {
        initInterp.setValue(0)
      }
    }, [initInterp, active])
    const wrapperAnimStyle = {
      transform: [
        {
          translateY: initInterp.interpolate({
            inputRange: [0, 1],
            outputRange: [winHeight, 0],
          }),
        },
      ],
    }

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
    ...Platform.select({
      ios: {
        paddingTop: 24,
      },
    }),
  },
})
