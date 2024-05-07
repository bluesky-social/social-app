import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'

import {useWebBodyScrollLock} from '#/lib/hooks/useWebBodyScrollLock'
import type {Modal as ModalIface} from '#/state/modals'
import {useModalControls, useModals} from '#/state/modals'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import * as AddAppPassword from './AddAppPasswords'
import * as AltTextImageModal from './AltImage'
import * as ChangeEmailModal from './ChangeEmail'
import * as ChangeHandleModal from './ChangeHandle'
import * as ChangePasswordModal from './ChangePassword'
import * as CreateOrEditListModal from './CreateOrEditList'
import * as CropImageModal from './crop-image/CropImage.web'
import * as DeleteAccountModal from './DeleteAccount'
import * as EditImageModal from './EditImage'
import * as EditProfileModal from './EditProfile'
import * as InviteCodesModal from './InviteCodes'
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings'
import * as PostLanguagesSettingsModal from './lang-settings/PostLanguagesSettings'
import * as LinkWarningModal from './LinkWarning'
import * as ListAddUserModal from './ListAddRemoveUsers'
import * as RepostModal from './Repost'
import * as SelfLabelModal from './SelfLabel'
import * as ThreadgateModal from './Threadgate'
import * as UserAddRemoveLists from './UserAddRemoveLists'
import * as VerifyEmailModal from './VerifyEmail'

export function ModalsContainer() {
  const {isModalActive, activeModals} = useModals()
  useWebBodyScrollLock(isModalActive)

  if (!isModalActive) {
    return null
  }

  return (
    <>
      {activeModals.map((modal, i) => (
        <Modal key={`modal-${i}`} modal={modal} />
      ))}
    </>
  )
}

function Modal({modal}: {modal: ModalIface}) {
  const {isModalActive} = useModals()
  const {closeModal} = useModalControls()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()

  const clickInsideRef = React.useRef<boolean>(false)

  if (!isModalActive) {
    return null
  }

  const onPressMask = (ev: React.MouseEvent<HTMLDivElement>) => {
    // 1. Ignore clicks from inside the modal
    // 2. Ignore clicks that started inside the modal and ended in the mask
    if (ev.target !== ev.currentTarget.firstChild || clickInsideRef.current) {
      return
    }

    if (
      modal.name === 'crop-image' ||
      modal.name === 'edit-image' ||
      modal.name === 'alt-text-image'
    ) {
      return // dont close on mask presses during crop
    }

    closeModal()
  }

  const onInnerPressIn = () => {
    clickInsideRef.current = true
  }

  const onInnerPressOut = () => {
    clickInsideRef.current = false
  }

  let element
  if (modal.name === 'edit-profile') {
    element = <EditProfileModal.Component {...modal} />
  } else if (modal.name === 'create-or-edit-list') {
    element = <CreateOrEditListModal.Component {...modal} />
  } else if (modal.name === 'user-add-remove-lists') {
    element = <UserAddRemoveLists.Component {...modal} />
  } else if (modal.name === 'list-add-remove-users') {
    element = <ListAddUserModal.Component {...modal} />
  } else if (modal.name === 'crop-image') {
    element = <CropImageModal.Component {...modal} />
  } else if (modal.name === 'delete-account') {
    element = <DeleteAccountModal.Component />
  } else if (modal.name === 'repost') {
    element = <RepostModal.Component {...modal} />
  } else if (modal.name === 'self-label') {
    element = <SelfLabelModal.Component {...modal} />
  } else if (modal.name === 'threadgate') {
    element = <ThreadgateModal.Component {...modal} />
  } else if (modal.name === 'change-handle') {
    element = <ChangeHandleModal.Component {...modal} />
  } else if (modal.name === 'invite-codes') {
    element = <InviteCodesModal.Component />
  } else if (modal.name === 'add-app-password') {
    element = <AddAppPassword.Component />
  } else if (modal.name === 'content-languages-settings') {
    element = <ContentLanguagesSettingsModal.Component />
  } else if (modal.name === 'post-languages-settings') {
    element = <PostLanguagesSettingsModal.Component />
  } else if (modal.name === 'alt-text-image') {
    element = <AltTextImageModal.Component {...modal} />
  } else if (modal.name === 'edit-image') {
    element = <EditImageModal.Component {...modal} />
  } else if (modal.name === 'verify-email') {
    element = <VerifyEmailModal.Component {...modal} />
  } else if (modal.name === 'change-email') {
    element = <ChangeEmailModal.Component />
  } else if (modal.name === 'change-password') {
    element = <ChangePasswordModal.Component />
  } else if (modal.name === 'link-warning') {
    element = <LinkWarningModal.Component {...modal} />
  } else {
    return null
  }

  return (
    <div onClick={onPressMask}>
      <Animated.View
        style={styles.mask}
        entering={FadeIn.duration(150)}
        exiting={FadeOut}>
        <div onPointerDown={onInnerPressIn} onPointerUp={onInnerPressOut}>
          <View
            style={[
              styles.container,
              isMobile && styles.containerMobile,
              pal.view,
              pal.border,
            ]}>
            {element}
          </View>
        </div>
      </Animated.View>
    </div>
  )
}

const styles = StyleSheet.create({
  mask: {
    // @ts-ignore
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 600,
    // @ts-ignore web only
    maxWidth: '100vw',
    // @ts-ignore web only
    maxHeight: '90vh',
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
