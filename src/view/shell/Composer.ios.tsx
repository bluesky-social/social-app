import {useEffect} from 'react'
import {Modal, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'

import {useComposerState} from '#/state/shell/composer'
import {ComposePost, useComposerCancelRef} from '#/view/com/composer/Composer'
import {atoms as a, useTheme} from '#/alf'

export function Composer() {
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()

  const open = !!state

  useEffect(() => {
    if (open) {
      const entry = SystemBars.pushStackEntry({
        style: {
          statusBar: 'light',
        },
      })
      return () => SystemBars.popStackEntry(entry)
    }
  }, [open])

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={open}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}>
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
        />
      </View>
    </Modal>
  )
}
