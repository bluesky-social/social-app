/// <reference lib="dom" />

import {Image as RNImage} from 'react-native-image-crop-picker'

import {CameraOpts, CropperOptions} from './types'
export {openPicker} from './picker.shared'

export async function openCamera(_opts: CameraOpts): Promise<RNImage> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('TODO')
}

export async function openCropperNative(_opts: CropperOptions) {
  throw new Error('Native only: use CropImageDialog instead')
}
