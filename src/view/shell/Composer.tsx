import React from 'react'
import {Modal} from 'react-native'
import {observer} from 'mobx-react-lite'

import {Provider as LegacyModalProvider} from '#/state/modals'
import {useComposerState} from 'state/shell/composer'
import {ModalsContainer as LegacyModalsContainer} from '#/view/com/modals/Modal'
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
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}>
      <LegacyModalProvider>
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
          <LegacyModalsContainer />
          <PortalOutlet />
        </PortalProvider>
      </LegacyModalProvider>
    </Modal>
  )
})
