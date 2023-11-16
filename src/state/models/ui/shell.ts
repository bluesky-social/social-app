import {AppBskyActorDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {makeAutoObservable, runInAction} from 'mobx'
import {
  shouldRequestEmailConfirmation,
  setEmailConfirmationRequested,
} from '#/state/shell/reminders'
import {unstable__openModal} from '#/state/modals'

export type ColorMode = 'system' | 'light' | 'dark'

export function isColorMode(v: unknown): v is ColorMode {
  return v === 'system' || v === 'light' || v === 'dark'
}

interface LightboxModel {}

export class ProfileImageLightbox implements LightboxModel {
  name = 'profile-image'
  constructor(public profile: AppBskyActorDefs.ProfileViewDetailed) {
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

export class ShellUiModel {
  isLightboxActive = false
  activeLightbox: ProfileImageLightbox | ImagesLightbox | null = null
  tickEveryMinute = Date.now()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
    })

    this.setupClock()
    this.setupLoginModals()
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
    return false
  }

  /**
   * used to clear out any modals, eg for a navigation
   */
  closeAllActiveElements() {
    if (this.isLightboxActive) {
      this.closeLightbox()
    }
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

  setupClock() {
    setInterval(() => {
      runInAction(() => {
        this.tickEveryMinute = Date.now()
      })
    }, 60_000)
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
