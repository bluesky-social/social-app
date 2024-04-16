import React from 'react'
import {Modal} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {observer} from 'mobx-react-lite'

import {isIOS} from '#/platform/detection'
import {useComposerState} from 'state/shell/composer'
import {
  Outlet as PortalOutlet,
  Provider as PortalProvider,
} from '#/components/Portal'
import {ComposePost, useComposerCancelRef} from '../com/composer/Composer'

export const Composer = observer(function ComposerImpl({}: {
  winHeight: number
}) {
  const state = useComposerState()
  const ref = useComposerCancelRef()

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={!!state}
      presentationStyle="formSheet"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}>
      <PortalProvider>
        <ComposePost
          cancelRef={ref}
          replyTo={state?.replyTo}
          onPost={state?.onPost}
          quote={state?.quote}
          mention={state?.mention}
          text={state?.text}
          imageUris={state?.imageUris}
        />
        <PortalOutlet />
        {isIOS && <StatusBar style="light" />}
      </PortalProvider>
    </Modal>
  )
})
