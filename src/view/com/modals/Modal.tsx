import React, {Fragment, useEffect, useRef} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import BottomSheet from '@discord/bottom-sheet/src'

import {useModalControls, useModals} from '#/state/modals'
import {usePalette} from 'lib/hooks/usePalette'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'
import * as AddAppPassword from './AddAppPasswords'
import * as AltImageModal from './AltImage'
import * as EditImageModal from './AltImage'
import * as ChangeEmailModal from './ChangeEmail'
import * as ChangeHandleModal from './ChangeHandle'
import * as ChangePasswordModal from './ChangePassword'
import * as CreateOrEditListModal from './CreateOrEditList'
import * as DeleteAccountModal from './DeleteAccount'
import * as EditProfileModal from './EditProfile'
import * as InAppBrowserConsentModal from './InAppBrowserConsent'
import * as InviteCodesModal from './InviteCodes'
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings'
import * as PostLanguagesSettingsModal from './lang-settings/PostLanguagesSettings'
import * as LinkWarningModal from './LinkWarning'
import * as ListAddUserModal from './ListAddRemoveUsers'
import * as SelfLabelModal from './SelfLabel'
import * as UserAddRemoveListsModal from './UserAddRemoveLists'
import * as VerifyEmailModal from './VerifyEmail'

const DEFAULT_SNAPPOINTS = ['90%']
const HANDLE_HEIGHT = 24

export function ModalsContainer() {
  const {isModalActive, activeModals} = useModals()
  const {closeModal} = useModalControls()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const pal = usePalette('default')
  const activeModal = activeModals[activeModals.length - 1]

  const onBottomSheetChange = async (snapPoint: number) => {
    if (snapPoint === -1) {
      closeModal()
    }
  }

  const onClose = () => {
    bottomSheetRef.current?.close()
    closeModal()
  }

  useEffect(() => {
    if (isModalActive) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isModalActive, bottomSheetRef, activeModal?.name])

  let snapPoints: (string | number)[] = DEFAULT_SNAPPOINTS
  let element
  if (activeModal?.name === 'edit-profile') {
    snapPoints = EditProfileModal.snapPoints
    element = <EditProfileModal.Component {...activeModal} />
  } else if (activeModal?.name === 'create-or-edit-list') {
    snapPoints = CreateOrEditListModal.snapPoints
    element = <CreateOrEditListModal.Component {...activeModal} />
  } else if (activeModal?.name === 'user-add-remove-lists') {
    snapPoints = UserAddRemoveListsModal.snapPoints
    element = <UserAddRemoveListsModal.Component {...activeModal} />
  } else if (activeModal?.name === 'list-add-remove-users') {
    snapPoints = ListAddUserModal.snapPoints
    element = <ListAddUserModal.Component {...activeModal} />
  } else if (activeModal?.name === 'delete-account') {
    snapPoints = DeleteAccountModal.snapPoints
    element = <DeleteAccountModal.Component />
  } else if (activeModal?.name === 'self-label') {
    snapPoints = SelfLabelModal.snapPoints
    element = <SelfLabelModal.Component {...activeModal} />
  } else if (activeModal?.name === 'alt-text-image') {
    snapPoints = AltImageModal.snapPoints
    element = <AltImageModal.Component {...activeModal} />
  } else if (activeModal?.name === 'edit-image') {
    snapPoints = AltImageModal.snapPoints
    element = <EditImageModal.Component {...activeModal} />
  } else if (activeModal?.name === 'change-handle') {
    snapPoints = ChangeHandleModal.snapPoints
    element = <ChangeHandleModal.Component {...activeModal} />
  } else if (activeModal?.name === 'invite-codes') {
    snapPoints = InviteCodesModal.snapPoints
    element = <InviteCodesModal.Component />
  } else if (activeModal?.name === 'add-app-password') {
    snapPoints = AddAppPassword.snapPoints
    element = <AddAppPassword.Component />
  } else if (activeModal?.name === 'content-languages-settings') {
    snapPoints = ContentLanguagesSettingsModal.snapPoints
    element = <ContentLanguagesSettingsModal.Component />
  } else if (activeModal?.name === 'post-languages-settings') {
    snapPoints = PostLanguagesSettingsModal.snapPoints
    element = <PostLanguagesSettingsModal.Component />
  } else if (activeModal?.name === 'verify-email') {
    snapPoints = VerifyEmailModal.snapPoints
    element = <VerifyEmailModal.Component {...activeModal} />
  } else if (activeModal?.name === 'change-email') {
    snapPoints = ChangeEmailModal.snapPoints
    element = <ChangeEmailModal.Component />
  } else if (activeModal?.name === 'change-password') {
    snapPoints = ChangePasswordModal.snapPoints
    element = <ChangePasswordModal.Component />
  } else if (activeModal?.name === 'link-warning') {
    snapPoints = LinkWarningModal.snapPoints
    element = <LinkWarningModal.Component {...activeModal} />
  } else if (activeModal?.name === 'in-app-browser-consent') {
    snapPoints = InAppBrowserConsentModal.snapPoints
    element = <InAppBrowserConsentModal.Component {...activeModal} />
  } else {
    return null
  }

  if (snapPoints[0] === 'fullscreen') {
    return (
      <SafeAreaView style={[styles.fullscreenContainer, pal.view]}>
        {element}
      </SafeAreaView>
    )
  }

  const Container = activeModal ? FullWindowOverlay : Fragment

  return (
    <Container>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleHeight={HANDLE_HEIGHT}
        index={isModalActive ? 0 : -1}
        enablePanDownToClose
        android_keyboardInputMode="adjustResize"
        keyboardBlurBehavior="restore"
        backdropComponent={
          isModalActive ? createCustomBackdrop(onClose) : undefined
        }
        handleIndicatorStyle={{backgroundColor: pal.text.color}}
        handleStyle={[styles.handle, pal.view]}
        onChange={onBottomSheetChange}>
        {element}
      </BottomSheet>
    </Container>
  )
}

const styles = StyleSheet.create({
  handle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})
