import React from 'react'
import {Modal, View} from 'react-native'

import {useDialogStateControlContext} from '#/state/dialogs'
import {useComposerState} from '#/state/shell/composer'
import {ComposePost, useComposerCancelRef} from '#/view/com/composer/Composer'
import {atoms as a, useTheme} from '#/alf'
import {SheetCompatProvider as TooltipSheetCompatProvider} from '#/components/Tooltip'

export function Composer({}: {winHeight: number}) {
  const {setFullyExpandedCount} = useDialogStateControlContext()
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()

  const open = !!state
  const prevOpen = React.useRef(open)

  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setFullyExpandedCount(c => c + 1)
    } else if (!open && prevOpen.current) {
      setFullyExpandedCount(c => c - 1)
    }
    prevOpen.current = open
  }, [open, setFullyExpandedCount])

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={open}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}>
      <View style={[t.atoms.bg, a.flex_1]}>
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
          />
        </TooltipSheetCompatProvider>
      </View>
    </Modal>
  )
}
