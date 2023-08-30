import React, {useRef, useEffect} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {observer} from 'mobx-react-lite'
import BottomSheet from '@gorhom/bottom-sheet'
import {useStores} from 'state/index'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'
import {usePalette} from 'lib/hooks/usePalette'
import {navigate} from '../../../Navigation'
import once from 'lodash.once'

import * as ConfirmModal from './Confirm'
import * as EditProfileModal from './EditProfile'
import * as ProfilePreviewModal from './ProfilePreview'
import * as ServerInputModal from './ServerInput'
import * as RepostModal from './Repost'
import * as SelfLabelModal from './SelfLabel'
import * as CreateOrEditMuteListModal from './CreateOrEditMuteList'
import * as ListAddRemoveUserModal from './ListAddRemoveUser'
import * as AltImageModal from './AltImage'
import * as EditImageModal from './AltImage'
import * as ReportModal from './report/Modal'
import * as DeleteAccountModal from './DeleteAccount'
import * as ChangeHandleModal from './ChangeHandle'
import * as WaitlistModal from './Waitlist'
import * as InviteCodesModal from './InviteCodes'
import * as AddAppPassword from './AddAppPasswords'
import * as ContentFilteringSettingsModal from './ContentFilteringSettings'
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings'
import * as PostLanguagesSettingsModal from './lang-settings/PostLanguagesSettings'
import * as ModerationDetailsModal from './ModerationDetails'

const DEFAULT_SNAPPOINTS = ['90%']

export const ModalsContainer = observer(function ModalsContainer() {
  const store = useStores()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const pal = usePalette('default')

  const activeModal =
    store.shell.activeModals[store.shell.activeModals.length - 1]

  const navigateOnce = once(navigate)

  const onBottomSheetAnimate = (fromIndex: number, toIndex: number) => {
    if (activeModal?.name === 'profile-preview' && toIndex === 1) {
      // begin loading the profile screen behind the scenes
      navigateOnce('Profile', {name: activeModal.did})
    }
  }
  const onBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      store.shell.closeModal()
    } else if (activeModal?.name === 'profile-preview' && snapPoint === 1) {
      // ensure we navigate to Profile and close the modal
      navigateOnce('Profile', {name: activeModal.did})
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
  }, [store.shell.isModalActive, bottomSheetRef, activeModal?.name])

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
  } else if (activeModal?.name === 'server-input') {
    snapPoints = ServerInputModal.snapPoints
    element = <ServerInputModal.Component {...activeModal} />
  } else if (activeModal?.name === 'report') {
    snapPoints = ReportModal.snapPoints
    element = <ReportModal.Component {...activeModal} />
  } else if (activeModal?.name === 'create-or-edit-mute-list') {
    snapPoints = CreateOrEditMuteListModal.snapPoints
    element = <CreateOrEditMuteListModal.Component {...activeModal} />
  } else if (activeModal?.name === 'list-add-remove-user') {
    snapPoints = ListAddRemoveUserModal.snapPoints
    element = <ListAddRemoveUserModal.Component {...activeModal} />
  } else if (activeModal?.name === 'delete-account') {
    snapPoints = DeleteAccountModal.snapPoints
    element = <DeleteAccountModal.Component />
  } else if (activeModal?.name === 'repost') {
    snapPoints = RepostModal.snapPoints
    element = <RepostModal.Component {...activeModal} />
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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={store.shell.isModalActive ? 0 : -1}
      enablePanDownToClose
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
      backdropComponent={
        store.shell.isModalActive ? createCustomBackdrop(onClose) : undefined
      }
      handleIndicatorStyle={{backgroundColor: pal.text.color}}
      handleStyle={[styles.handle, pal.view]}
      onAnimate={onBottomSheetAnimate}
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
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})
