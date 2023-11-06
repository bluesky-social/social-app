import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {AppBskyEmbedRecord, AppBskyActorDefs, ModerationUI} from '@atproto/api'
import {makeAutoObservable, runInAction} from 'mobx'
import {Image as RNImage} from 'react-native-image-crop-picker'

import {isWeb} from '#/platform/detection'
import {RootStoreModel} from '#/state/models/root-store'
import {ProfileModel} from '#/state/models/content/profile'
import {isObj, hasProp} from '#/lib/type-guards'
import {ImageModel} from '#/state/models/media/image'
import {ListModel} from '#/state/models/content/list'
import {GalleryModel} from '#/state/models/media/gallery'

export type ColorMode = 'system' | 'light' | 'dark'

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
  profileView: ProfileModel
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
  list?: ListModel
  onSave?: (uri: string) => void
}

export interface UserAddRemoveListsModal {
  name: 'user-add-remove-lists'
  subject: string
  displayName: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}

export interface ListAddUserModal {
  name: 'list-add-user'
  list: ListModel
  onAdd?: (profile: AppBskyActorDefs.ProfileViewBasic) => void
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
  | ListAddUserModal

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

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  author: {
    handle: string
    displayName?: string
    avatar?: string
  }
}
export interface ComposerOptsQuote {
  uri: string
  cid: string
  text: string
  indexedAt: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  embeds?: AppBskyEmbedRecord.ViewRecord['embeds']
}
export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef
  onPost?: () => void
  quote?: ComposerOptsQuote
  mention?: string // handle of user to mention
}

type Context = {
  colorMode: ColorMode
  minimalShellMode: boolean
  isDrawerOpen: boolean
  isDrawerSwipeDisabled: boolean
  isModalActive: boolean
  activeModals: Modal[]
  isLightboxActive: boolean
  isComposerActive: boolean
  composerOpts?: ComposerOpts
  tickEveryMinute: number
}

export function isColorMode(v: unknown): v is ColorMode {
  return v === 'system' || v === 'light' || v === 'dark'
}

const defaultContextValue = {
  colorMode: 'system' as const,
  minimalShellMode: false,
  isDrawerOpen: false,
  isDrawerSwipeDisabled: false,
  isModalActive: false,
  activeModals: [],
  isLightboxActive: false,
  isComposerActive: false,
  composerOpts: undefined,
  tickEveryMinute: Date.now(),
}

const context = React.createContext<Context>(defaultContextValue)

export function Provider({children}: React.PropsWithChildren<{}>) {
  return <context.Provider value={defaultContextValue}>{children}</context.Provider>
}
