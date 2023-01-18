import {PhotoIdentifier} from './../../../node_modules/@react-native-camera-roll/camera-roll/src/CameraRoll'
import {makeAutoObservable, runInAction} from 'mobx'
import {CameraRoll} from '@react-native-camera-roll/camera-roll'
import {RootStoreModel} from './root-store'

export type {PhotoIdentifier} from './../../../node_modules/@react-native-camera-roll/camera-roll/src/CameraRoll'

export class UserLocalPhotosModel {
  // state
  photos: PhotoIdentifier[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
    })
  }

  async setup() {
    await this._getPhotos()
  }

  private async _getPhotos() {
    CameraRoll.getPhotos({first: 20}).then(r => {
      runInAction(() => {
        this.photos = r.edges
      })
    })
  }
}
