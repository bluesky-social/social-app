/// <reference lib="dom" />

import {CameraOpts, CropperOptions} from './types'
import {RootStoreModel} from 'state/index'
import {Image as RNImage} from 'react-native-image-crop-picker'
export {openPicker} from './picker.shared'

export async function openCamera(
  _store: RootStoreModel,
  _opts: CameraOpts,
): Promise<RNImage> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

export async function openCropper(
  store: RootStoreModel,
  opts: CropperOptions,
): Promise<RNImage> {
  // TODO handle more opts
  return new Promise((resolve, reject) => {
    store.shell.openModal({
      name: 'crop-image',
      uri: opts.path,
      onSelect: (img?: RNImage) => {
        if (img) {
          resolve(img)
        } else {
          reject(new Error('Canceled'))
        }
      },
    })
  })
}
