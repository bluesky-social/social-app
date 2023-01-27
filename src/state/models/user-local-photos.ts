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
    const r = await CameraRoll.getPhotos({first: 20})
    runInAction(() => {
      this.photos = r.edges
    })
  }
}
