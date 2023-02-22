import React, {useRef, useEffect} from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import BottomSheet from '@gorhom/bottom-sheet'
import {useStores} from 'state/index'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'

import * as models from 'state/models/shell-ui'

import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ServerInputModal from './ServerInput'
import * as ReportPostModal from './ReportPost'
import * as ReportAccountModal from './ReportAccount'
import * as DeleteAccountModal from './DeleteAccount'
import {usePalette} from 'lib/hooks/usePalette'
import {StyleSheet} from 'react-native'

const CLOSED_SNAPPOINTS = ['10%']

export const Modal = observer(function Modal() {
  const store = useStores()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const pal = usePalette('default')
  const onBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      store.shell.closeModal()
    }
  }
  const onClose = () => {
    bottomSheetRef.current?.close()
    store.shell.closeModal()
  }

  useEffect(() => {
    if (store.shell.isModalActive) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [store.shell.isModalActive, bottomSheetRef, store.shell.activeModal?.name])

  let snapPoints: (string | number)[] = CLOSED_SNAPPOINTS
  let element
  if (store.shell.activeModal?.name === 'confirm') {
    snapPoints = ConfirmModal.snapPoints
    element = (
      <ConfirmModal.Component
        {...(store.shell.activeModal as models.ConfirmModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'edit-profile') {
    snapPoints = EditProfileModal.snapPoints
    element = (
      <EditProfileModal.Component
        {...(store.shell.activeModal as models.EditProfileModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'server-input') {
    snapPoints = ServerInputModal.snapPoints
    element = (
      <ServerInputModal.Component
        {...(store.shell.activeModal as models.ServerInputModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'report-post') {
    snapPoints = ReportPostModal.snapPoints
    element = (
      <ReportPostModal.Component
        {...(store.shell.activeModal as models.ReportPostModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'report-account') {
    snapPoints = ReportAccountModal.snapPoints
    element = (
      <ReportAccountModal.Component
        {...(store.shell.activeModal as models.ReportAccountModal)}
      />
    )
  } else if (store.shell.activeModal?.name === 'delete-account') {
    snapPoints = DeleteAccountModal.snapPoints
    element = <DeleteAccountModal.Component />
  } else {
    element = <View />
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={store.shell.isModalActive ? 0 : -1}
      enablePanDownToClose
      keyboardBehavior="fillParent"
      backdropComponent={
        store.shell.isModalActive ? createCustomBackdrop(onClose) : undefined
      }
      handleIndicatorStyle={{backgroundColor: pal.text.color}}
      handleStyle={[styles.handle, pal.view]}
      onChange={onBottomSheetChange}>
      {element}
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  handle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
})
