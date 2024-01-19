import React from 'react'
import {TouchableWithoutFeedback, StyleSheet, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useWebBodyScrollLock} from '#/lib/hooks/useWebBodyScrollLock'

import {useModals, useModalControls} from '#/state/modals'
import type {Modal as ModalIface} from '#/state/modals'
import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ProfilePreviewModal from './ProfilePreview'
import * as ServerInputModal from './ServerInput'
import * as ReportModal from './report/Modal'
import * as AppealLabelModal from './AppealLabel'
import * as CreateOrEditListModal from './CreateOrEditList'
import * as UserAddRemoveLists from './UserAddRemoveLists'
import * as ListAddUserModal from './ListAddRemoveUsers'
import * as DeleteAccountModal from './DeleteAccount'
import * as RepostModal from './Repost'
import * as SelfLabelModal from './SelfLabel'
import * as ThreadgateModal from './Threadgate'
import * as CropImageModal from './crop-image/CropImage.web'
import * as AltTextImageModal from './AltImage'
import * as EditImageModal from './EditImage'
import * as ChangeHandleModal from './ChangeHandle'
import * as WaitlistModal from './Waitlist'
import * as InviteCodesModal from './InviteCodes'
import * as AddAppPassword from './AddAppPasswords'
import * as ContentFilteringSettingsModal from './ContentFilteringSettings'
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings'
import * as PostLanguagesSettingsModal from './lang-settings/PostLanguagesSettings'
import * as ModerationDetailsModal from './ModerationDetails'
import * as BirthDateSettingsModal from './BirthDateSettings'
import * as VerifyEmailModal from './VerifyEmail'
import * as ChangeEmailModal from './ChangeEmail'
import * as LinkWarningModal from './LinkWarning'
import * as EmbedConsentModal from './EmbedConsent'

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

  if (!isModalActive) {
    return null
  }

  const onPressMask = () => {
    if (
      modal.name === 'crop-image' ||
      modal.name === 'edit-image' ||
      modal.name === 'alt-text-image'
    ) {
      return // dont close on mask presses during crop
    }
    closeModal()
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
  } else if (modal.name === 'profile-preview') {
    element = <ProfilePreviewModal.Component {...modal} />
  } else if (modal.name === 'server-input') {
    element = <ServerInputModal.Component {...modal} />
  } else if (modal.name === 'report') {
    element = <ReportModal.Component {...modal} />
  } else if (modal.name === 'appeal-label') {
    element = <AppealLabelModal.Component {...modal} />
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
  } else if (modal.name === 'post-languages-settings') {
    element = <PostLanguagesSettingsModal.Component />
  } else if (modal.name === 'alt-text-image') {
    element = <AltTextImageModal.Component {...modal} />
  } else if (modal.name === 'edit-image') {
    element = <EditImageModal.Component {...modal} />
  } else if (modal.name === 'moderation-details') {
    element = <ModerationDetailsModal.Component {...modal} />
  } else if (modal.name === 'birth-date-settings') {
    element = <BirthDateSettingsModal.Component />
  } else if (modal.name === 'verify-email') {
    element = <VerifyEmailModal.Component {...modal} />
  } else if (modal.name === 'change-email') {
    element = <ChangeEmailModal.Component />
  } else if (modal.name === 'link-warning') {
    element = <LinkWarningModal.Component {...modal} />
  } else if (modal.name === 'embed-consent') {
    element = <EmbedConsentModal.Component {...modal} />
  } else {
    return null
  }

  return (
    // eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors
    <TouchableWithoutFeedback onPress={onPressMask}>
      <Animated.View
        style={styles.mask}
        entering={FadeIn.duration(150)}
        exiting={FadeOut}>
        {/* eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors */}
        <TouchableWithoutFeedback onPress={onInnerPress}>
          <View
            style={[
              styles.container,
              isMobile && styles.containerMobile,
              pal.view,
              pal.border,
            ]}>
            {element}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
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
