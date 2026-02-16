import {type ImagePickerAsset, type ImagePickerOptions} from 'expo-image-picker'
import {type OpenCropperOptions} from '@bsky.app/expo-image-crop-tool'

import {type PickerImage} from './picker.shared'

export {openPicker, openUnifiedPicker} from './picker.shared'

export async function openCamera(
  _opts: ImagePickerOptions,
): Promise<PickerImage & {asset: ImagePickerAsset}> {
  throw new Error('openCamera is not supported on web')
}

export async function openCropper(
  _opts: OpenCropperOptions,
): Promise<PickerImage> {
  throw new Error(
    'openCropper is not supported on web. Use EditImageDialog instead.',
  )
}
