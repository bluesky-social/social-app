import React from 'react'
import {AppBskyActorDefs, AppBskyGraphDefs, ModerationUI} from '@atproto/api'
import {StyleProp, ViewStyle} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'

import {ImageModel} from '#/state/models/media/image'
import {GalleryModel} from '#/state/models/media/gallery'

export interface ConfirmModal {
  name: 'confirm'
  title: string
  message: string | (() => JSX.Element)
  onPressConfirm: () => void | Promise<void>
  onPressCancel?: () => void | Promise<void>
  confirmBtnText?: string
  confirmBtnStyle?: StyleProp<ViewStyle>
  cancelBtnText?: string
}

export interface EditProfileModal {
  name: 'edit-profile'
  profile: AppBskyActorDefs.ProfileViewDetailed
  onUpdate?: () => void
}

export interface ProfilePreviewModal {
  name: 'profile-preview'
  did: string
}

export interface ServerInputModal {
  name: 'server-input'
  initialService: string
  onSelect: (url: string) => void
}

export interface ModerationDetailsModal {
  name: 'moderation-details'
  context: 'account' | 'content'
  moderation: ModerationUI
}

export type ReportModal = {
  name: 'report'
} & (
  | {
      uri: string
      cid: string
    }
  | {did: string}
)

export interface CreateOrEditListModal {
  name: 'create-or-edit-list'
  purpose?: string
  list?: AppBskyGraphDefs.ListView
  onSave?: (uri: string) => void
}

export interface UserAddRemoveListsModal {
  name: 'user-add-remove-lists'
  subject: string
  displayName: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}

export interface ListAddRemoveUsersModal {
  name: 'list-add-remove-users'
  list: AppBskyGraphDefs.ListView
  onChange?: (
    type: 'add' | 'remove',
    profile: AppBskyActorDefs.ProfileViewBasic,
  ) => void
}

export interface EditImageModal {
  name: 'edit-image'
  image: ImageModel
  gallery: GalleryModel
}

export interface CropImageModal {
  name: 'crop-image'
  uri: string
  onSelect: (img?: RNImage) => void
}

export interface AltTextImageModal {
  name: 'alt-text-image'
  image: ImageModel
}

export interface DeleteAccountModal {
  name: 'delete-account'
}

export interface RepostModal {
  name: 'repost'
  onRepost: () => void
  onQuote: () => void
  isReposted: boolean
}

export interface SelfLabelModal {
  name: 'self-label'
  labels: string[]
  hasMedia: boolean
  onChange: (labels: string[]) => void
}

export interface ChangeHandleModal {
  name: 'change-handle'
  onChanged: () => void
}

export interface WaitlistModal {
  name: 'waitlist'
}

export interface InviteCodesModal {
  name: 'invite-codes'
}

export interface AddAppPasswordModal {
  name: 'add-app-password'
}

export interface ContentFilteringSettingsModal {
  name: 'content-filtering-settings'
}

export interface ContentLanguagesSettingsModal {
  name: 'content-languages-settings'
}

export interface PostLanguagesSettingsModal {
  name: 'post-languages-settings'
}

export interface BirthDateSettingsModal {
  name: 'birth-date-settings'
}

export interface VerifyEmailModal {
  name: 'verify-email'
  showReminder?: boolean
}

export interface ChangeEmailModal {
  name: 'change-email'
}

export interface SwitchAccountModal {
  name: 'switch-account'
}

export interface LinkWarningModal {
  name: 'link-warning'
  text: string
  href: string
}

export type Modal =
  // Account
  | AddAppPasswordModal
  | ChangeHandleModal
  | DeleteAccountModal
  | EditProfileModal
  | ProfilePreviewModal
  | BirthDateSettingsModal
  | VerifyEmailModal
  | ChangeEmailModal
  | SwitchAccountModal

  // Curation
  | ContentFilteringSettingsModal
  | ContentLanguagesSettingsModal
  | PostLanguagesSettingsModal

  // Moderation
  | ModerationDetailsModal
  | ReportModal

  // Lists
  | CreateOrEditListModal
  | UserAddRemoveListsModal
  | ListAddRemoveUsersModal

  // Posts
  | AltTextImageModal
  | CropImageModal
  | EditImageModal
  | ServerInputModal
  | RepostModal
  | SelfLabelModal

  // Bluesky access
  | WaitlistModal
  | InviteCodesModal

  // Generic
  | ConfirmModal
  | LinkWarningModal

const ModalContext = React.createContext<{
  isModalActive: boolean
  activeModals: Modal[]
}>({
  isModalActive: false,
  activeModals: [],
})

const ModalControlContext = React.createContext<{
  openModal: (modal: Modal) => void
  closeModal: () => boolean
  closeAllModals: () => void
}>({
  openModal: () => {},
  closeModal: () => false,
  closeAllModals: () => {},
})

/**
 * @deprecated DO NOT USE THIS unless you have no other choice.
 */
export let unstable__openModal: (modal: Modal) => void = () => {
  throw new Error(`ModalContext is not initialized`)
}

/**
 * @deprecated DO NOT USE THIS unless you have no other choice.
 */
export let unstable__closeModal: () => boolean = () => {
  throw new Error(`ModalContext is not initialized`)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [isModalActive, setIsModalActive] = React.useState(false)
  const [activeModals, setActiveModals] = React.useState<Modal[]>([])

  const openModal = React.useCallback(
    (modal: Modal) => {
      setActiveModals(activeModals => [...activeModals, modal])
      setIsModalActive(true)
    },
    [setIsModalActive, setActiveModals],
  )

  const closeModal = React.useCallback(() => {
    let totalActiveModals = 0
    let wasActive = isModalActive
    setActiveModals(activeModals => {
      activeModals = activeModals.slice(0, -1)
      totalActiveModals = activeModals.length
      return activeModals
    })
    setIsModalActive(totalActiveModals > 0)
    return wasActive
  }, [setIsModalActive, setActiveModals, isModalActive])

  const closeAllModals = React.useCallback(() => {
    setActiveModals([])
    setIsModalActive(false)
  }, [setActiveModals, setIsModalActive])

  unstable__openModal = openModal
  unstable__closeModal = closeModal

  const state = React.useMemo(
    () => ({
      isModalActive,
      activeModals,
    }),
    [isModalActive, activeModals],
  )

  const methods = React.useMemo(
    () => ({
      openModal,
      closeModal,
      closeAllModals,
    }),
    [openModal, closeModal, closeAllModals],
  )

  return (
    <ModalContext.Provider value={state}>
      <ModalControlContext.Provider value={methods}>
        {children}
      </ModalControlContext.Provider>
    </ModalContext.Provider>
  )
}

export function useModals() {
  return React.useContext(ModalContext)
}

export function useModalControls() {
  return React.useContext(ModalControlContext)
}
