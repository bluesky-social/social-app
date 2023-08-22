import {AppBskyEmbedRecord, ModerationUI} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {makeAutoObservable, runInAction} from 'mobx'
import {ProfileModel} from '../content/profile'
import {isObj, hasProp} from 'lib/type-guards'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {ImageModel} from '../media/image'
import {ListModel} from '../content/list'
import {GalleryModel} from '../media/gallery'
import {StyleProp, ViewStyle} from 'react-native'

export type ColorMode = 'system' | 'light' | 'dark'

export function isColorMode(v: unknown): v is ColorMode {
  return v === 'system' || v === 'light' || v === 'dark'
}

export interface ConfirmModal {
  name: 'confirm'
  title: string
  message: string | (() => JSX.Element)
  onPressConfirm: () => void | Promise<void>
  onPressCancel?: () => void | Promise<void>
  confirmBtnText?: string
  confirmBtnStyle?: StyleProp<ViewStyle>
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

export interface CreateOrEditMuteListModal {
  name: 'create-or-edit-mute-list'
  list?: ListModel
  onSave?: (uri: string) => void
}

export interface ListAddRemoveUserModal {
  name: 'list-add-remove-user'
  subject: string
  displayName: string
  onUpdate?: () => void
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

export interface PreferencesHomeFeed {
  name: 'preferences-home-feed'
}

export interface OnboardingModal {
  name: 'onboarding'
}

export type Modal =
  // Account
  | AddAppPasswordModal
  | ChangeHandleModal
  | DeleteAccountModal
  | EditProfileModal
  | ProfilePreviewModal

  // Curation
  | ContentFilteringSettingsModal
  | ContentLanguagesSettingsModal
  | PostLanguagesSettingsModal
  | PreferencesHomeFeed

  // Moderation
  | ModerationDetailsModal
  | ReportModal
  | CreateOrEditMuteListModal
  | ListAddRemoveUserModal

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

  // Onboarding
  | OnboardingModal

  // Generic
  | ConfirmModal

interface LightboxModel {}

export class ProfileImageLightbox implements LightboxModel {
  name = 'profile-image'
  constructor(public profileView: ProfileModel) {
    makeAutoObservable(this)
  }
}

interface ImagesLightboxItem {
  uri: string
  alt?: string
}

export class ImagesLightbox implements LightboxModel {
  name = 'images'
  constructor(public images: ImagesLightboxItem[], public index: number) {
    makeAutoObservable(this)
  }
  setIndex(index: number) {
    this.index = index
  }
}

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

export class ShellUiModel {
  colorMode: ColorMode = 'system'
  minimalShellMode = false
  isDrawerOpen = false
  isDrawerSwipeDisabled = false
  isModalActive = false
  activeModals: Modal[] = []
  isLightboxActive = false
  activeLightbox: ProfileImageLightbox | ImagesLightbox | null = null
  isComposerActive = false
  composerOpts: ComposerOpts | undefined
  tickEveryMinute = Date.now()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      serialize: false,
      rootStore: false,
      hydrate: false,
    })

    this.setupClock()
  }

  serialize(): unknown {
    return {
      colorMode: this.colorMode,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'colorMode') && isColorMode(v.colorMode)) {
        this.colorMode = v.colorMode
      }
    }
  }

  setColorMode(mode: ColorMode) {
    this.colorMode = mode
  }

  setMinimalShellMode(v: boolean) {
    this.minimalShellMode = v
  }

  /**
   * returns true if something was closed
   * (used by the android hardware back btn)
   */
  closeAnyActiveElement(): boolean {
    if (this.isLightboxActive) {
      this.closeLightbox()
      return true
    }
    if (this.isModalActive) {
      this.closeModal()
      return true
    }
    if (this.isComposerActive) {
      this.closeComposer()
      return true
    }
    if (this.isDrawerOpen) {
      this.closeDrawer()
      return true
    }
    return false
  }

  /**
   * used to clear out any modals, eg for a navigation
   */
  closeAllActiveElements() {
    if (this.isLightboxActive) {
      this.closeLightbox()
    }
    while (this.isModalActive) {
      this.closeModal()
    }
    if (this.isComposerActive) {
      this.closeComposer()
    }
    if (this.isDrawerOpen) {
      this.closeDrawer()
    }
  }

  openDrawer() {
    this.isDrawerOpen = true
  }

  closeDrawer() {
    this.isDrawerOpen = false
  }

  setIsDrawerSwipeDisabled(v: boolean) {
    this.isDrawerSwipeDisabled = v
  }

  openModal(modal: Modal) {
    this.rootStore.emitNavigation()
    this.isModalActive = true
    this.activeModals.push(modal)
  }

  closeModal() {
    this.activeModals.pop()
    this.isModalActive = this.activeModals.length > 0
  }

  openLightbox(lightbox: ProfileImageLightbox | ImagesLightbox) {
    this.rootStore.emitNavigation()
    this.isLightboxActive = true
    this.activeLightbox = lightbox
  }

  closeLightbox() {
    this.isLightboxActive = false
    this.activeLightbox = null
  }

  openComposer(opts: ComposerOpts) {
    this.rootStore.emitNavigation()
    this.isComposerActive = true
    this.composerOpts = opts
  }

  closeComposer() {
    this.isComposerActive = false
    this.composerOpts = undefined
  }

  setupClock() {
    setInterval(() => {
      runInAction(() => {
        this.tickEveryMinute = Date.now()
      })
    }, 60_000)
  }
}
