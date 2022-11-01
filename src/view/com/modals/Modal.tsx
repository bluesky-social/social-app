import React, {useRef, useEffect} from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import BottomSheet from '@gorhom/bottom-sheet'
import {useStores} from '../../../state'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'

import * as models from '../../../state/models/shell'

import * as LinkActionsModal from './LinkActions'
import * as SharePostModal from './SharePost.native'
import * as ComposePostModal from './ComposePost'
import * as EditProfile from './EditProfile'

const CLOSED_SNAPPOINTS = ['10%']

export const Modal = observer(function Modal() {
  const store = useStores()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const onShareBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      store.shell.closeModal()
    }
  }
  const onClose = () => {
    bottomSheetRef.current?.close()
  }

  useEffect(() => {
    if (store.shell.isModalActive) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [store.shell.isModalActive, bottomSheetRef])

  let snapPoints: (string | number)[] = CLOSED_SNAPPOINTS
  let element
  if (store.shell.activeModal?.name === 'link-actions') {
    snapPoints = LinkActionsModal.snapPoints
    element = (
      <LinkActionsModal.Component
        {...(store.shell.activeModal as models.LinkActionsModel)}
      />
    )
  } else if (store.shell.activeModal?.name === 'share-post') {
    snapPoints = SharePostModal.snapPoints
    element = (
      <SharePostModal.Component
        {...(store.shell.activeModal as models.SharePostModel)}
      />
    )
  } else if (store.shell.activeModal?.name === 'compose-post') {
    snapPoints = ComposePostModal.snapPoints
    element = (
      <ComposePostModal.Component
        {...(store.shell.activeModal as models.ComposePostModel)}
      />
    )
  } else if (store.shell.activeModal?.name === 'edit-profile') {
    snapPoints = EditProfile.snapPoints
    element = (
      <EditProfile.Component
        {...(store.shell.activeModal as models.EditProfileModel)}
      />
    )
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
      onChange={onShareBottomSheetChange}>
      {element}
    </BottomSheet>
  )
})
