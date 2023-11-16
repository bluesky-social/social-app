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

  /**
   * returns true if something was closed
   * (used by the android hardware back btn)
   */
  closeAnyActiveElement(): boolean {
    return false
  }

  /**
   * used to clear out any modals, eg for a navigation
   */
  closeAllActiveElements() {}

  setupLoginModals() {
    this.rootStore.onSessionReady(() => {
      if (shouldRequestEmailConfirmation(this.rootStore.session)) {
        unstable__openModal({name: 'verify-email', showReminder: true})
        setEmailConfirmationRequested()
      }
    })
  }
}
