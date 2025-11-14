import {useEffect} from 'react'
import {Modal, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'

import {useComposerState} from '#/state/shell/composer'
import {useComposerReducer} from '#/view/com/composer/state/composer'
import {atoms as a, useTheme} from '#/alf'
import {ComposePost, useComposerCancelRef} from '../com/composer/Composer'

export function Composer({}: {winHeight: number}) {
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()

  const open = !!state

  const [composerState, composerDispatch, isDirty] = useComposerReducer(state)

  useEffect(() => {
    if (open) {
      const entry = SystemBars.pushStackEntry({
        style: {statusBar: 'light'},
      })
      return () => {
        SystemBars.popStackEntry(entry)
      }
    }
  }, [open])

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={open}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}
      allowSwipeDismissal={!isDirty}>
      <View style={[t.atoms.bg, a.flex_1]}>
        <ComposePost
          cancelRef={ref}
          replyTo={state?.replyTo}
          onPost={state?.onPost}
          onPostSuccess={state?.onPostSuccess}
          quote={state?.quote}
          mention={state?.mention}
          text={state?.text}
          imageUris={state?.imageUris}
          videoUri={state?.videoUri}
          composerState={composerState}
          composerDispatch={composerDispatch}
          isDirty={isDirty}
        />
      </View>
    </Modal>
  )
}
