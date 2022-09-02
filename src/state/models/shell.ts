import {makeAutoObservable} from 'mobx'

export class LinkActionsModel {
  name = 'link-actions'

  constructor(public href: string, public title: string) {
    makeAutoObservable(this)
  }
}

export class ShellModel {
  isModalActive = false
  activeModal: LinkActionsModel | undefined

  constructor() {
    makeAutoObservable(this)
  }

  openModal(modal: LinkActionsModel) {
    this.isModalActive = true
    this.activeModal = modal
  }

  closeModal() {
    this.isModalActive = false
    this.activeModal = undefined
  }
}
