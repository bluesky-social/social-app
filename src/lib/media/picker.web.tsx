/// <reference lib="dom" />

import {type Image as RNImage} from 'react-native-image-crop-picker'

import {type CameraOpts, type CropperOptions} from './types'

export {openPicker} from './picker.shared'

export async function openCamera(_opts: CameraOpts): Promise<RNImage> {
  // const mediaType = opts.mediaType || 'photo' TODO
  throw new Error('openCamera is not supported on web')
}

export async function openCropper(_opts: CropperOptions): Promise<RNImage> {
  throw new Error(
    'openCropper is not supported on web. Use EditImageDialog instead.',
  )
}
