import React from 'react'
import {TouchableWithoutFeedback, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import type {Modal as ModalIface} from 'state/models/ui/shell'
import {isMobileWeb} from 'platform/detection'

import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ServerInputModal from './ServerInput'
import * as ReportPostModal from './ReportPost'
import * as ReportAccountModal from './ReportAccount'
import * as DeleteAccountModal from './DeleteAccount'
import * as RepostModal from './Repost'
import * as CropImageModal from './crop-image/CropImage.web'
import * as AltTextImageModal from './AltImage'
import * as AltTextImageReadModal from './AltImageRead'
import * as ChangeHandleModal from './ChangeHandle'
import * as WaitlistModal from './Waitlist'
import * as InviteCodesModal from './InviteCodes'
import * as AddAppPassword from './AddAppPasswords'
import * as ContentFilteringSettingsModal from './ContentFilteringSettings'
import * as ContentLanguagesSettingsModal from './ContentLanguagesSettings'

export const ModalsContainer = observer(function ModalsContainer() {
  const store = useStores()

  if (!store.shell.isModalActive) {
    return null
  }

  return (
    <>
      {store.shell.activeModals.map((modal, i) => (
        <Modal key={`modal-${i}`} modal={modal} />
      ))}
    </>
  )
})

function Modal({modal}: {modal: ModalIface}) {
  const store = useStores()
  const pal = usePalette('default')

  if (!store.shell.isModalActive) {
    return null
  }

  const onPressMask = () => {
    if (modal.name === 'crop-image') {
      return // dont close on mask presses during crop
    }
    store.shell.closeModal()
  }
  const onInnerPress = () => {
    // TODO: can we use prevent default?
    // do nothing, we just want to stop it from bubbling
  }

  let element
  if (modal.name === 'confirm') {
    element = <ConfirmModal.Component {...modal} />
  } else if (modal.name === 'edit-profile') {
    element = <EditProfileModal.Component {...modal} />
  } else if (modal.name === 'server-input') {
    element = <ServerInputModal.Component {...modal} />
  } else if (modal.name === 'report-post') {
    element = <ReportPostModal.Component {...modal} />
  } else if (modal.name === 'report-account') {
    element = <ReportAccountModal.Component {...modal} />
  } else if (modal.name === 'crop-image') {
    element = <CropImageModal.Component {...modal} />
  } else if (modal.name === 'delete-account') {
    element = <DeleteAccountModal.Component />
  } else if (modal.name === 'repost') {
    element = <RepostModal.Component {...modal} />
  } else if (modal.name === 'change-handle') {
    element = <ChangeHandleModal.Component {...modal} />
  } else if (modal.name === 'waitlist') {
    element = <WaitlistModal.Component />
  } else if (modal.name === 'invite-codes') {
    element = <InviteCodesModal.Component />
  } else if (modal.name === 'add-app-password') {
    element = <AddAppPassword.Component />
  } else if (modal.name === 'content-filtering-settings') {
    element = <ContentFilteringSettingsModal.Component />
  } else if (modal.name === 'content-languages-settings') {
    element = <ContentLanguagesSettingsModal.Component />
  } else if (modal.name === 'alt-text-image') {
    element = <AltTextImageModal.Component {...modal} />
  } else if (modal.name === 'alt-text-image-read') {
    element = <AltTextImageReadModal.Component {...modal} />
  } else {
    return null
  }

  return (
    // eslint-disable-next-line
    <TouchableWithoutFeedback onPress={onPressMask}>
      <View style={styles.mask}>
        {/* eslint-disable-next-line */}
        <TouchableWithoutFeedback onPress={onInnerPress}>
          <View
            style={[
              styles.container,
              isMobileWeb && styles.containerMobile,
              pal.view,
              pal.border,
            ]}>
            {element}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 500,
    maxWidth: '100vw',
    maxHeight: '100vh',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  containerMobile: {
    borderRadius: 0,
    paddingHorizontal: 0,
  },
})
