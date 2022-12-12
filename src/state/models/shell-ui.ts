import {makeAutoObservable} from 'mobx'
import {ProfileViewModel} from './profile-view'

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

export class CreateSceneModal {
  name = 'create-scene'

  constructor() {
    makeAutoObservable(this)
  }
}

export class InviteToSceneModal {
  name = 'invite-to-scene'

  constructor(public profileView: ProfileViewModel) {
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

export class ProfileImageLightbox {
  name = 'profile-image'
  constructor(public profileView: ProfileViewModel) {
    makeAutoObservable(this)
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
  isMainMenuOpen = false
  isModalActive = false
  activeModal:
    | ConfirmModal
    | EditProfileModal
    | CreateSceneModal
    | ServerInputModal
    | undefined
  isLightboxActive = false
  activeLightbox: ProfileImageLightbox | undefined
  isComposerActive = false
  composerOpts: ComposerOpts | undefined

  constructor() {
    makeAutoObservable(this)
  }

  setMainMenuOpen(v: boolean) {
    this.isMainMenuOpen = v
  }

  openModal(
    modal:
      | ConfirmModal
      | EditProfileModal
      | CreateSceneModal
      | ServerInputModal,
  ) {
    this.isModalActive = true
    this.activeModal = modal
  }

  closeModal() {
    this.isModalActive = false
    this.activeModal = undefined
  }

  openLightbox(lightbox: ProfileImageLightbox) {
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
