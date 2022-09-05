import {makeAutoObservable} from 'mobx'

export class LinkActionsModel {
  name = 'link-actions'

  constructor(public href: string, public title: string) {
    makeAutoObservable(this)
  }
}

export class SharePostModel {
  name = 'share-post'

  constructor(public href: string) {
    makeAutoObservable(this)
  }
}

export class ComposePostModel {
  name = 'compose-post'

  constructor(public replyTo?: string) {
    makeAutoObservable(this)
  }
}

export class ShellModel {
  isModalActive = false
  activeModal: LinkActionsModel | SharePostModel | ComposePostModel | undefined

  constructor() {
    makeAutoObservable(this)
  }

  openModal(modal: LinkActionsModel | SharePostModel | ComposePostModel) {
    this.isModalActive = true
    this.activeModal = modal
  }

  closeModal() {
    this.isModalActive = false
    this.activeModal = undefined
  }
}
