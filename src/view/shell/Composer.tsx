import {useEffect} from 'react'
import {SystemBars} from 'react-native-edge-to-edge'
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated'

import {useEnableKeyboardController} from '#/lib/hooks/useEnableKeyboardController'
import {useComposerState} from '#/state/shell/composer'
import {ComposePost} from '#/view/com/composer/Composer'
import {atoms as a, useTheme} from '#/alf'

export function Composer() {
  const state = useComposerState()
  const t = useTheme()

  const open = !!state

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
      entering={SlideInDown.duration(300).easing(Easing.out(Easing.exp))}
      exiting={SlideOutDown.duration(200).easing(Easing.in(Easing.quad))}
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
