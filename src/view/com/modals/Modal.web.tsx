import React from 'react'
import {TouchableWithoutFeedback, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

import * as models from 'state/models/shell-ui'

import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ServerInputModal from './ServerInput'
import * as ReportPostModal from './ReportPost'
import * as ReportAccountModal from './ReportAccount'
import * as CropImageModal from './crop-image/CropImage.web'

export const Modal = observer(function Modal() {
  const store = useStores()
  const pal = usePalette('default')

  if (!store.shell.isModalActive) {
    return null
  }

  const onClose = () => {
    store.shell.closeModal()
  }
  const onInnerPress = () => {
    // do nothing, we just want to stop it from bubbling
  }

  let element
  if (store.shell.activeModal?.name === 'confirm') {
    element = (
      <ConfirmModal.Component
        {...(store.shell.activeModal as models.ConfirmModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'edit-profile') {
    element = (
      <EditProfileModal.Component
        {...(store.shell.activeModal as models.EditProfileModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'server-input') {
    element = (
      <ServerInputModal.Component
        {...(store.shell.activeModal as models.ServerInputModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'report-post') {
    element = (
      <ReportPostModal.Component
        {...(store.shell.activeModal as models.ReportPostModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'report-account') {
    element = (
      <ReportAccountModal.Component
        {...(store.shell.activeModal as models.ReportAccountModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'crop-image') {
    element = (
      <CropImageModal.Component
        {...(store.shell.activeModal as models.CropImageModal)}
      />
    )
  } else {
    return null
  }

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.mask}>
        <TouchableWithoutFeedback onPress={onInnerPress}>
          <View style={[styles.container, pal.view]}>{element}</View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  )
})

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
