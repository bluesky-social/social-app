import {makeAutoObservable} from 'mobx'
import {ProfileViewModel} from './profile-view'
import * as Post from '../../third-party/api/src/client/types/app/bsky/feed/post'

export interface LinkActionsModelOpts {
  newTab?: boolean
}
export class LinkActionsModel {
  name = 'link-actions'
  newTab: boolean

  constructor(
    public href: string,
    public title: string,
    opts?: LinkActionsModelOpts,
  ) {
    makeAutoObservable(this)
    this.newTab = typeof opts?.newTab === 'boolean' ? opts.newTab : true
  }
}

export class ConfirmModel {
  name = 'confirm'

  constructor(
    public title: string,
    public message: string | (() => JSX.Element),
    public onPressConfirm: () => void | Promise<void>,
  ) {
    makeAutoObservable(this)
  }
}

export class SharePostModel {
  name = 'share-post'

  constructor(public href: string) {
    makeAutoObservable(this)
  }
}

export class EditProfileModel {
  name = 'edit-profile'

  constructor(public profileView: ProfileViewModel) {
    makeAutoObservable(this)
  }
}

export class CreateSceneModel {
  name = 'create-scene'

  constructor() {
    makeAutoObservable(this)
  }
}

export class InviteToSceneModel {
  name = 'invite-to-scene'

  constructor(public profileView: ProfileViewModel) {
    makeAutoObservable(this)
  }
}

export interface ComposerOpts {
  replyTo?: Post.PostRef
  onPost?: () => void
}

export class ShellUiModel {
  isModalActive = false
  activeModal:
    | LinkActionsModel
    | ConfirmModel
    | SharePostModel
    | EditProfileModel
    | CreateSceneModel
    | undefined
  isComposerActive = false
  composerOpts: ComposerOpts | undefined

  constructor() {
    makeAutoObservable(this)
  }

  openModal(
    modal:
      | LinkActionsModel
      | ConfirmModel
      | SharePostModel
      | EditProfileModel
      | CreateSceneModel,
  ) {
    this.isModalActive = true
    this.activeModal = modal
  }

  closeModal() {
    this.isModalActive = false
    this.activeModal = undefined
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
