import {useEffect} from 'react'
import {Animated, Easing} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'

import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'
import {useComposerState} from '#/state/shell/composer'
import {atoms as a, useTheme} from '#/alf'
import {ComposePost} from '../com/composer/Composer'
import {useComposerReducer} from '../com/composer/state/composer'

export function Composer({winHeight}: {winHeight: number}) {
  const state = useComposerState()
  const t = useTheme()
  const initInterp = useAnimatedValue(0)

  const open = !!state

  const [composerState, composerDispatch, isDirty] = useComposerReducer(state)

  useEffect(() => {
    if (open) {
      const entry = SystemBars.pushStackEntry({
        style: {statusBar: t.scheme === 'light' ? 'dark' : 'light'},
      })
      return () => {
        SystemBars.popStackEntry(entry)
      }
    }
  }, [open, t.scheme])

  useEffect(() => {
    if (open) {
      Animated.timing(initInterp, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start()
    } else {
      initInterp.setValue(0)
    }
  }, [initInterp, open])
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

  if (!open) {
    return null
  }

  return (
    <Animated.View
      style={[a.absolute, a.inset_0, t.atoms.bg, wrapperAnimStyle]}
      aria-modal
      accessibilityViewIsModal>
      <ComposePost
        replyTo={state.replyTo}
        onPost={state.onPost}
        onPostSuccess={state.onPostSuccess}
        quote={state.quote}
        mention={state.mention}
        text={state.text}
        imageUris={state.imageUris}
        videoUri={state.videoUri}
        composerState={composerState}
        composerDispatch={composerDispatch}
        isDirty={isDirty}
      />
    </Animated.View>
  )
}
