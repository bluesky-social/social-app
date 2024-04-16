import React from 'react'
import {Modal} from 'react-native'
import {observer} from 'mobx-react-lite'

import {useComposerState} from 'state/shell/composer'
import {ComposePost} from '../com/composer/Composer'

export const Composer = observer(function ComposerImpl({}: {
  winHeight: number
}) {
  const state = useComposerState()

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={!!state}
      presentationStyle="formSheet"
      animationType="slide">
      <ComposePost
        replyTo={state?.replyTo}
        onPost={state?.onPost}
        quote={state?.quote}
        mention={state?.mention}
        text={state?.text}
        imageUris={state?.imageUris}
      />
    </Modal>
  )
})
