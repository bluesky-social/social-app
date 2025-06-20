import {useEffect, useMemo} from 'react'
import {useWindowDimensions} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'
import Animated, {
  Easing,
  type LayoutAnimation,
  withTiming,
} from 'react-native-reanimated'

import {useEnableKeyboardController} from '#/lib/hooks/useEnableKeyboardController'
import {useComposerState} from '#/state/shell/composer'
import {ComposePost} from '#/view/com/composer/Composer'
import {atoms as a, useTheme} from '#/alf'

export function Composer() {
  const state = useComposerState()
  const t = useTheme()
  const {height} = useWindowDimensions()

  const open = !!state

  // HACKFIX: the builtin "SlideInDown" and "SlideOutDown"
  // animations are broken, because they rely on getting the window
  // height from reanimated and it appears to be 0 initially.
  // We can recreate the same animation but just pass in the window
  // dimensions from JS -sfn
  // TODO: Fix upstream
  const {EnterAnimation, ExitAnimation} = useMemo(() => {
    return {
      EnterAnimation: (): LayoutAnimation => {
        'worklet'
        return {
          animations: {
            originY: withTiming(0, {
              duration: 200,
              easing: Easing.out(Easing.quad),
            }),
          },
          initialValues: {
            originY: height,
          },
        }
      },
      ExitAnimation: (): LayoutAnimation => {
        'worklet'
        return {
          animations: {
            originY: withTiming(height, {
              duration: 200,
              easing: Easing.in(Easing.quad),
            }),
          },
          initialValues: {
            originY: 0,
          },
        }
      },
    }
  }, [height])

  useEffect(() => {
    if (open) {
      const entry = SystemBars.pushStackEntry({
        style: {
          statusBar: t.name !== 'light' ? 'light' : 'dark',
        },
      })
      return () => SystemBars.popStackEntry(entry)
    }
  }, [open, t.name])

  useEnableKeyboardController(!!state)

  if (!open) {
    return null
  }

  return (
    <Animated.View
      style={[a.absolute, a.inset_0, t.atoms.bg]}
      entering={EnterAnimation}
      exiting={ExitAnimation}
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
        openGallery={state.openGallery}
      />
    </Animated.View>
  )
}
