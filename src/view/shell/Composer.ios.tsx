import {useEffect} from 'react'
import {Modal, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'

import {useComposerState} from '#/state/shell/composer'
import {ComposePost, useComposerCancelRef} from '#/view/com/composer/Composer'
import {atoms as a, useTheme} from '#/alf'
import {SheetCompatProvider as TooltipSheetCompatProvider} from '#/components/Tooltip'
import {IS_LIQUID_GLASS} from '#/env'

export function Composer() {
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()

  const open = !!state

  useEffect(() => {
    if (open && !IS_LIQUID_GLASS) {
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
      onRequestClose={() => ref.current?.onPressCancel()}
      backdropColor="transparent">
      <View style={[a.flex_1, t.atoms.bg]}>
        <TooltipSheetCompatProvider>
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
            editPost={state?.editPost}
          />
        </TooltipSheetCompatProvider>
      </View>
    </Modal>
  )
}
