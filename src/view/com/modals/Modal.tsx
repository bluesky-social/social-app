import React, {useRef, useEffect} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import BottomSheet from '@gorhom/bottom-sheet'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'
import {usePalette} from 'lib/hooks/usePalette'
import {timeout} from 'lib/async/timeout'
import {navigate} from '../../../Navigation'
import once from 'lodash.once'

import {useModals, useModalControls} from '#/state/modals'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ProfilePreviewModal from './ProfilePreview'
import * as ServerInputModal from './ServerInput'
import * as RepostModal from './Repost'
import * as SelfLabelModal from './SelfLabel'
import * as ThreadgateModal from './Threadgate'
import * as CreateOrEditListModal from './CreateOrEditList'
import * as UserAddRemoveListsModal from './UserAddRemoveLists'
import * as ListAddUserModal from './ListAddRemoveUsers'
import * as AltImageModal from './AltImage'
import * as EditImageModal from './AltImage'
import * as ReportModal from './report/Modal'
import * as AppealLabelModal from './AppealLabel'
import * as DeleteAccountModal from './DeleteAccount'
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
import * as ChangePasswordModal from './ChangePassword'
import * as SwitchAccountModal from './SwitchAccount'
import * as LinkWarningModal from './LinkWarning'
import * as EmbedConsentModal from './EmbedConsent'
import * as InAppBrowserConsentModal from './InAppBrowserConsent'

const DEFAULT_SNAPPOINTS = ['90%']
const HANDLE_HEIGHT = 24

export function ModalsContainer() {
  const {isModalActive, activeModals} = useModals()
  const {closeModal} = useModalControls()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const pal = usePalette('default')
  const safeAreaInsets = useSafeAreaInsets()

  const activeModal = activeModals[activeModals.length - 1]

  const navigateOnce = once(navigate)

  // It seems like the bottom sheet bugs out when this callback changes.
  const onBottomSheetAnimate = useNonReactiveCallback(
    (_fromIndex: number, toIndex: number) => {
      if (activeModal?.name === 'profile-preview' && toIndex === 1) {
        // begin loading the profile screen behind the scenes
        navigateOnce('Profile', {name: activeModal.did})
      }
    },
  )
  const onBottomSheetChange = async (snapPoint: number) => {
    if (snapPoint === -1) {
      closeModal()
    } else if (activeModal?.name === 'profile-preview' && snapPoint === 1) {
      await navigateOnce('Profile', {name: activeModal.did})
      // There is no particular callback for when the view has actually been presented.
      // This delay gives us a decent chance the navigation has flushed *and* images have loaded.
      // It's acceptable because the data is already being fetched + it usually takes longer anyway.
      // TODO: Figure out why avatar/cover don't always show instantly from cache.
      await timeout(200)
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

  let needsSafeTopInset = false
  let snapPoints: (string | number)[] = DEFAULT_SNAPPOINTS
  let element
  if (activeModal?.name === 'confirm') {
    snapPoints = ConfirmModal.snapPoints
    element = <ConfirmModal.Component {...activeModal} />
  } else if (activeModal?.name === 'edit-profile') {
    snapPoints = EditProfileModal.snapPoints
    element = <EditProfileModal.Component {...activeModal} />
  } else if (activeModal?.name === 'profile-preview') {
    snapPoints = ProfilePreviewModal.snapPoints
    element = <ProfilePreviewModal.Component {...activeModal} />
    needsSafeTopInset = true // Need to align with the target profile screen.
  } else if (activeModal?.name === 'server-input') {
    snapPoints = ServerInputModal.snapPoints
    element = <ServerInputModal.Component {...activeModal} />
  } else if (activeModal?.name === 'report') {
    snapPoints = ReportModal.snapPoints
    element = <ReportModal.Component {...activeModal} />
  } else if (activeModal?.name === 'appeal-label') {
    snapPoints = AppealLabelModal.snapPoints
    element = <AppealLabelModal.Component {...activeModal} />
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
  } else if (activeModal?.name === 'repost') {
    snapPoints = RepostModal.snapPoints
    element = <RepostModal.Component {...activeModal} />
  } else if (activeModal?.name === 'self-label') {
    snapPoints = SelfLabelModal.snapPoints
    element = <SelfLabelModal.Component {...activeModal} />
  } else if (activeModal?.name === 'threadgate') {
    snapPoints = ThreadgateModal.snapPoints
    element = <ThreadgateModal.Component {...activeModal} />
  } else if (activeModal?.name === 'alt-text-image') {
    snapPoints = AltImageModal.snapPoints
    element = <AltImageModal.Component {...activeModal} />
  } else if (activeModal?.name === 'edit-image') {
    snapPoints = AltImageModal.snapPoints
    element = <EditImageModal.Component {...activeModal} />
  } else if (activeModal?.name === 'change-handle') {
    snapPoints = ChangeHandleModal.snapPoints
    element = <ChangeHandleModal.Component {...activeModal} />
  } else if (activeModal?.name === 'waitlist') {
    snapPoints = WaitlistModal.snapPoints
    element = <WaitlistModal.Component />
  } else if (activeModal?.name === 'invite-codes') {
    snapPoints = InviteCodesModal.snapPoints
    element = <InviteCodesModal.Component />
  } else if (activeModal?.name === 'add-app-password') {
    snapPoints = AddAppPassword.snapPoints
    element = <AddAppPassword.Component />
  } else if (activeModal?.name === 'content-filtering-settings') {
    snapPoints = ContentFilteringSettingsModal.snapPoints
    element = <ContentFilteringSettingsModal.Component />
  } else if (activeModal?.name === 'content-languages-settings') {
    snapPoints = ContentLanguagesSettingsModal.snapPoints
    element = <ContentLanguagesSettingsModal.Component />
  } else if (activeModal?.name === 'post-languages-settings') {
    snapPoints = PostLanguagesSettingsModal.snapPoints
    element = <PostLanguagesSettingsModal.Component />
  } else if (activeModal?.name === 'moderation-details') {
    snapPoints = ModerationDetailsModal.snapPoints
    element = <ModerationDetailsModal.Component {...activeModal} />
  } else if (activeModal?.name === 'birth-date-settings') {
    snapPoints = BirthDateSettingsModal.snapPoints
    element = <BirthDateSettingsModal.Component />
  } else if (activeModal?.name === 'verify-email') {
    snapPoints = VerifyEmailModal.snapPoints
    element = <VerifyEmailModal.Component {...activeModal} />
  } else if (activeModal?.name === 'change-email') {
    snapPoints = ChangeEmailModal.snapPoints
    element = <ChangeEmailModal.Component />
  } else if (activeModal?.name === 'change-password') {
    snapPoints = ChangePasswordModal.snapPoints
    element = <ChangePasswordModal.Component />
  } else if (activeModal?.name === 'switch-account') {
    snapPoints = SwitchAccountModal.snapPoints
    element = <SwitchAccountModal.Component />
  } else if (activeModal?.name === 'link-warning') {
    snapPoints = LinkWarningModal.snapPoints
    element = <LinkWarningModal.Component {...activeModal} />
  } else if (activeModal?.name === 'embed-consent') {
    snapPoints = EmbedConsentModal.snapPoints
    element = <EmbedConsentModal.Component {...activeModal} />
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

  const topInset = needsSafeTopInset ? safeAreaInsets.top - HANDLE_HEIGHT : 0
  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      topInset={topInset}
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
      onAnimate={onBottomSheetAnimate}
      onChange={onBottomSheetChange}>
      {element}
    </BottomSheet>
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
