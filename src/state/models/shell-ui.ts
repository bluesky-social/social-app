import {makeAutoObservable} from 'mobx'
import {ProfileViewModel} from './profile-view'
import * as Post from '../../third-party/api/src/client/types/app/bsky/feed/post'

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

export class EditProfileModel {
  name = 'edit-profile'

  constructor(
    public profileView: ProfileViewModel,
    public onUpdate?: () => void,
  ) {
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

export class ServerInputModel {
  name = 'server-input'

  constructor(
    public initialService: string,
    public onSelect: (url: string) => void,
  ) {
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
    | ConfirmModel
    | EditProfileModel
    | CreateSceneModel
    | ServerInputModel
    | undefined
  isComposerActive = false
  composerOpts: ComposerOpts | undefined

  constructor() {
    makeAutoObservable(this)
  }

  openModal(
    modal:
      | ConfirmModel
      | EditProfileModel
      | CreateSceneModel
      | ServerInputModel,
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
