import React, {useLayoutEffect} from 'react'
import {Modal, View} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import {observer} from 'mobx-react-lite'

import {isIOS} from '#/platform/detection'
import {Provider as LegacyModalProvider} from '#/state/modals'
import {useComposerState} from '#/state/shell/composer'
import {ModalsContainer as LegacyModalsContainer} from '#/view/com/modals/Modal'
import {atoms as a, useTheme} from '#/alf'
import {getBackgroundColor, useThemeName} from '#/alf/util/useColorModeTheme'
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

  const open = !!state

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={open}
      presentationStyle="formSheet"
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}>
      <View style={[t.atoms.bg, a.flex_1]}>
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
        {isIOS && <IOSModalBackground active={open} />}
      </View>
    </Modal>
  )
})

// Generally, the backdrop of the app is the theme color, but when this is open
// we want it to be black due to the modal being a form sheet.
function IOSModalBackground({active}: {active: boolean}) {
  const theme = useThemeName()

  useLayoutEffect(() => {
    SystemUI.setBackgroundColorAsync('black')

    return () => {
      SystemUI.setBackgroundColorAsync(getBackgroundColor(theme))
    }
  }, [theme])

  // Set the status bar to light - however, only if the modal is active
  // If we rely on this component being mounted to set this,
  // there'll be a delay before it switches back to default.
  return active ? <StatusBar style="light" animated /> : null
}
