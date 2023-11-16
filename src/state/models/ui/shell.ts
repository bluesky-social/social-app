import {RootStoreModel} from '../root-store'
import {makeAutoObservable} from 'mobx'
import {
  shouldRequestEmailConfirmation,
  setEmailConfirmationRequested,
} from '#/state/shell/reminders'
import {unstable__openModal} from '#/state/modals'

export type ColorMode = 'system' | 'light' | 'dark'

export function isColorMode(v: unknown): v is ColorMode {
  return v === 'system' || v === 'light' || v === 'dark'
}

export class ShellUiModel {
  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
    })

    this.setupLoginModals()
  }

  setupLoginModals() {
    this.rootStore.onSessionReady(() => {
      if (shouldRequestEmailConfirmation(this.rootStore.session)) {
        unstable__openModal({name: 'verify-email', showReminder: true})
        setEmailConfirmationRequested()
      }
    })
  }
}
