import React from 'react'
import {TouchableWithoutFeedback, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import type {Modal as ModalIface} from 'state/models/shell-ui'

import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ServerInputModal from './ServerInput'
import * as ReportPostModal from './ReportPost'
import * as ReportAccountModal from './ReportAccount'
import * as CropImageModal from './crop-image/CropImage.web'

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
  } else {
    return null
  }

  return (
    <TouchableWithoutFeedback onPress={onPressMask}>
      <View style={styles.mask}>
        <TouchableWithoutFeedback onPress={onInnerPress}>
          <View style={[styles.container, pal.view]}>{element}</View>
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
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
})
