import {makeAutoObservable} from 'mobx'
import {ProfileViewModel} from './profile-view'
import {isObj, hasProp} from '../lib/type-guards'

export class ConfirmModal {
  name = 'confirm'

  constructor(
    public title: string,
    public message: string | (() => JSX.Element),
    public onPressConfirm: () => void | Promise<void>,
  ) {
    makeAutoObservable(this)
  }
}

export class EditProfileModal {
  name = 'edit-profile'

  constructor(
    public profileView: ProfileViewModel,
    public onUpdate?: () => void,
  ) {
    makeAutoObservable(this)
  }
}

export class ServerInputModal {
  name = 'server-input'

  constructor(
    public initialService: string,
    public onSelect: (url: string) => void,
  ) {
    makeAutoObservable(this)
  }
}

export class ReportPostModal {
  name = 'report-post'

  constructor(public postUrl: string) {
    makeAutoObservable(this)
  }
}

export class ReportAccountModal {
  name = 'report-account'

  constructor(public did: string) {
    makeAutoObservable(this)
  }
}

interface LightboxModel {
  canSwipeLeft: boolean
  canSwipeRight: boolean
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export class ProfileImageLightbox implements LightboxModel {
  name = 'profile-image'
  canSwipeLeft = false
  canSwipeRight = false
  constructor(public profileView: ProfileViewModel) {
    makeAutoObservable(this)
  }
  onSwipeLeft() {}
  onSwipeRight() {}
}

export class ImageLightbox implements LightboxModel {
  name = 'image'
  canSwipeLeft = true
  canSwipeRight = true
  constructor(public uri: string) {
    makeAutoObservable(this)
  }
  onSwipeLeft() {}
  onSwipeRight() {}
}

export class ImagesLightbox implements LightboxModel {
  name = 'images'
  get canSwipeLeft() {
    return this.index > 0
  }
  get canSwipeRight() {
    return this.index < this.uris.length - 1
  }
  constructor(public uris: string[], public index: number) {
    makeAutoObservable(this)
  }
  onSwipeLeft() {
    if (this.canSwipeLeft) {
      this.index = this.index - 1
    }
  }
  onSwipeRight() {
    if (this.canSwipeRight) {
      this.index = this.index + 1
    }
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
export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef
  onPost?: () => void
}

export class ShellUiModel {
  darkMode = false
  minimalShellMode = false
  isMainMenuOpen = false
  isModalActive = false
  activeModal:
    | ConfirmModal
    | EditProfileModal
    | ServerInputModal
    | ReportPostModal
    | ReportAccountModal
    | undefined
  isLightboxActive = false
  activeLightbox:
    | ProfileImageLightbox
    | ImageLightbox
    | ImagesLightbox
    | undefined
  isComposerActive = false
  composerOpts: ComposerOpts | undefined

  constructor() {
    makeAutoObservable(this, {serialize: false, hydrate: false})
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

  setMainMenuOpen(v: boolean) {
    this.isMainMenuOpen = v
  }

  openModal(
    modal:
      | ConfirmModal
      | EditProfileModal
      | ServerInputModal
      | ReportPostModal
      | ReportAccountModal,
  ) {
    this.isModalActive = true
    this.activeModal = modal
  }

  closeModal() {
    this.isModalActive = false
    this.activeModal = undefined
  }

  openLightbox(
    lightbox: ProfileImageLightbox | ImageLightbox | ImagesLightbox,
  ) {
    this.isLightboxActive = true
    this.activeLightbox = lightbox
  }

  closeLightbox() {
    this.isLightboxActive = false
    this.activeLightbox = undefined
  }

  openComposer(opts: ComposerOpts) {
    this.isComposerActive = true
    this.composerOpts = opts
  }

  closeComposer() {
    this.isComposerActive = false
    this.composerOpts = undefined
  }
}
