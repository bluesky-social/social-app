import React from 'react'
import {Modal, View} from 'react-native'

import {useComposerState} from '#/state/shell/composer'
import {atoms as a, useTheme} from '#/alf'
import {ComposePost, useComposerCancelRef} from '../com/composer/Composer'

export function Composer({}: {winHeight: number}) {
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()

  const open = !!state

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
          quote={state?.quote}
          quoteCount={state?.quoteCount}
          mention={state?.mention}
          text={state?.text}
          imageUris={state?.imageUris}
          videoUri={state?.videoUri}
        />
      </View>
    </Modal>
  )
}
