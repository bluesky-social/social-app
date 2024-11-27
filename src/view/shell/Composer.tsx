import {useEffect} from 'react'
import {Animated, Easing, StyleSheet, View} from 'react-native'

import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {usePalette} from '#/lib/hooks/usePalette'
import {useComposerState} from '#/state/shell/composer'
import {ComposePost} from '../com/composer/Composer'

export function Composer({winHeight}: {winHeight: number}) {
  const state = useComposerState()
  const pal = usePalette('default')
  const initInterp = useAnimatedValue(0)

  useEffect(() => {
    if (state) {
      Animated.timing(initInterp, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start()
    } else {
      initInterp.setValue(0)
    }
  }, [initInterp, state])
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

  // rendering
  // =

  if (!state) {
    return <View />
  }

  return (
    <Animated.View
      style={[styles.wrapper, pal.view, wrapperAnimStyle]}
      aria-modal
      accessibilityViewIsModal>
      <ComposePost
        replyTo={state.replyTo}
        onPost={state.onPost}
        quote={state.quote}
        mention={state.mention}
        text={state.text}
        imageUris={state.imageUris}
        videoUri={state.videoUri}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
  },
})
