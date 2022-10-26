import {makeAutoObservable} from 'mobx'
import {ProfileViewModel} from './profile-view'
import * as Post from '../../third-party/api/src/types/app/bsky/post'

export class TabsSelectorModel {
  name = 'tabs-selector'

  constructor() {
    makeAutoObservable(this)
  }
}

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

export class SharePostModel {
  name = 'share-post'

  constructor(public href: string) {
    makeAutoObservable(this)
  }
}

export interface ComposePostModelOpts {
  replyTo?: Post.PostRef
  onPost?: () => void
}
export class ComposePostModel {
  name = 'compose-post'
  replyTo?: Post.PostRef
  onPost?: () => void

  constructor(opts?: ComposePostModelOpts) {
    makeAutoObservable(this)
    this.replyTo = opts?.replyTo
    this.onPost = opts?.onPost
  }
}

export class EditProfileModel {
  name = 'edit-profile'

  constructor(public profileView: ProfileViewModel) {
    makeAutoObservable(this)
  }
}

export class ShellModel {
  isModalActive = false
  activeModal:
    | TabsSelectorModel
    | LinkActionsModel
    | SharePostModel
    | ComposePostModel
    | EditProfileModel
    | undefined

  constructor() {
    makeAutoObservable(this)
  }

  openModal(
    modal:
      | TabsSelectorModel
      | LinkActionsModel
      | SharePostModel
      | ComposePostModel
      | EditProfileModel,
  ) {
    this.isModalActive = true
    this.activeModal = modal
  }

  closeModal() {
    this.isModalActive = false
    this.activeModal = undefined
  }
}
