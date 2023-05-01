import {AppBskyEmbedRecord} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {makeAutoObservable} from 'mobx'
import {ProfileModel} from '../content/profile'
import {isObj, hasProp} from 'lib/type-guards'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {ImageModel} from '../media/image'
import {GalleryModel} from '../media/gallery'

export interface ConfirmModal {
  name: 'confirm'
  title: string
  message: string | (() => JSX.Element)
  onPressConfirm: () => void | Promise<void>
  onPressCancel?: () => void | Promise<void>
}

export interface EditProfileModal {
  name: 'edit-profile'
  profileView: ProfileModel
  onUpdate?: () => void
}

export interface ServerInputModal {
  name: 'server-input'
  initialService: string
  onSelect: (url: string) => void
}

export interface ReportPostModal {
  name: 'report-post'
  postUri: string
  postCid: string
}

export interface ReportAccountModal {
  name: 'report-account'
  did: string
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

export type Modal =
  // Account
  | AddAppPasswordModal
  | ChangeHandleModal
  | DeleteAccountModal
  | EditProfileModal

  // Curation
  | ContentFilteringSettingsModal
  | ContentLanguagesSettingsModal

  // Reporting
  | ReportAccountModal
  | ReportPostModal

  // Posts
  | AltTextImageModal
  | CropImageModal
  | EditImageModal
  | ServerInputModal
  | RepostModal

  // Bluesky access
  | WaitlistModal
  | InviteCodesModal

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
}

export class ShellUiModel {
  darkMode = false
  minimalShellMode = false
  isDrawerOpen = false
  isDrawerSwipeDisabled = false
  isModalActive = false
  activeModals: Modal[] = []
  isLightboxActive = false
  activeLightbox: ProfileImageLightbox | ImagesLightbox | null = null
  isComposerActive = false
  composerOpts: ComposerOpts | undefined

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      serialize: false,
      rootStore: false,
      hydrate: false,
    })
  }

  serialize(): unknown {
    return {
      darkMode: this.darkMode,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'darkMode') && typeof v.darkMode === 'boolean') {
        this.darkMode = v.darkMode
      }
    }
  }

  setDarkMode(v: boolean) {
    this.darkMode = v
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
}
