import {
  openPicker as openPickerFn,
  openCamera as openCameraFn,
  openCropper as openCropperFn,
  ImageOrVideo,
} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {PickerOpts, CameraOpts, CropperOptions} from './types'
import {Image as RNImage} from 'react-native-image-crop-picker'

/**
 * NOTE
 * These methods all include the RootStoreModel as the first param
 * because the web versions require it. The signatures have to remain
 * equivalent between the different forms, but the store param is not
 * used here.
 * -prf
 */

export async function openPicker(
  _store: RootStoreModel,
  opts?: PickerOpts,
): Promise<RNImage[]> {
  const items = await openPickerFn({
    mediaType: 'photo', // TODO: eventually add other media types
    multiple: opts?.multiple,
    maxFiles: opts?.maxFiles,
    forceJpg: true, // ios only
    compressImageQuality: 0.8,
  })

  const toMedia = (item: ImageOrVideo) => ({
    path: item.path,
    mime: item.mime,
    size: item.size,
    width: item.width,
    height: item.height,
  })
  if (Array.isArray(items)) {
    return items.map(toMedia)
  }
  return [toMedia(items)]
}

export async function openCamera(
  _store: RootStoreModel,
  opts: CameraOpts,
): Promise<RNImage> {
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

export async function openCropper(
  _store: RootStoreModel,
  opts: CropperOptions,
): Promise<RNImage> {
  const item = await openCropperFn({
    ...opts,
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
