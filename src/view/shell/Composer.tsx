import React from 'react'
import {Modal, View} from 'react-native'
import {observer} from 'mobx-react-lite'

import {Provider as LegacyModalProvider} from '#/state/modals'
import {useComposerState} from 'state/shell/composer'
import {ModalsContainer as LegacyModalsContainer} from '#/view/com/modals/Modal'
import {useTheme} from '#/alf'
import {
  Outlet as PortalOutlet,
  Provider as PortalProvider,
} from '#/components/Portal'
import {ComposePost, useComposerCancelRef} from '../com/composer/Composer'

export const Composer = observer(function ComposerImpl({}: {
  winHeight: number
}) {
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={!!state}
      presentationStyle="overFullScreen"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}>
      <View style={[t.atoms.bg, {flex: 1}]}>
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
      </View>
    </Modal>
  )
})
