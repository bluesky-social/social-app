/// <reference lib="dom" />

import {type OpenCropperOptions} from 'expo-image-crop-tool'

import {unstable__openModal} from '#/state/modals'
import {type PickerImage} from './picker.shared'
import {type CameraOpts} from './types'

export {openPicker, type PickerImage as RNImage} from './picker.shared'

export async function openCamera(_opts: CameraOpts): Promise<PickerImage> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

export async function openCropper(
  opts: OpenCropperOptions,
): Promise<PickerImage> {
  // TODO handle more opts
  return new Promise((resolve, reject) => {
    unstable__openModal({
      name: 'crop-image',
      uri: opts.imageUri,
      aspect: opts.aspectRatio,
      circular: opts.shape === 'circle',
      onSelect: (img?: PickerImage) => {
        if (img) {
          resolve(img)
        } else {
          reject(new Error('Canceled'))
        }
      },
    })
  })
}
