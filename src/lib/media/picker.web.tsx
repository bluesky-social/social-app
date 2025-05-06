import {type OpenCropperOptions} from 'expo-image-crop-tool'

import {type PickerImage} from './picker.shared'
import {type CameraOpts} from './types'

export {openPicker} from './picker.shared'

export async function openCamera(_opts: CameraOpts): Promise<PickerImage> {
  throw new Error('openCamera is not supported on web')
}

export async function openCropper(
  _opts: OpenCropperOptions,
): Promise<PickerImage> {
  throw new Error(
    'openCropper is not supported on web. Use EditImageDialog instead.',
  )
}
