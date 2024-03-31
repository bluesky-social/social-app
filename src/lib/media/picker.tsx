import {
  Image as RNImage,
  openCamera as openCameraFn,
  openCropper as openCropperFn,
} from 'react-native-image-crop-picker'

import {CameraOpts, CropperOptions} from './types'
export {openPicker} from './picker.shared'

export async function openCamera(opts: CameraOpts): Promise<RNImage> {
  const item = await openCameraFn({
    width: opts.width,
    height: opts.height,
    freeStyleCropEnabled: opts.freeStyleCropEnabled,
    cropperCircleOverlay: opts.cropperCircleOverlay,
    cropping: false,
    forceJpg: true, // ios only
    compressImageQuality: 0.8,
  })

  return {
    path: item.path,
    mime: item.mime,
    size: item.size,
    width: item.width,
    height: item.height,
  }
}

export async function openCropper(opts: CropperOptions) {
  const item = await openCropperFn({
    ...opts,
    forceJpg: true, // ios only
  })

  return {
    path: item.path,
    mime: item.mime,
    size: item.size,
    width: item.width,
    height: item.height,
  }
}
