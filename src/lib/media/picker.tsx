import {
  openPicker as openPickerFn,
  openCamera as openCameraFn,
  openCropper as openCropperFn,
  ImageOrVideo,
} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {PickerOpts, CameraOpts, CropperOptions, Image} from './types'

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
  opts: PickerOpts,
): Promise<Image[]> {
  const mediaType = opts.mediaType || 'photo'
  const items = await openPickerFn({
    mediaType,
    multiple: opts.multiple,
    maxFiles: opts.maxFiles,
    forceJpg: true, // ios only
    compressImageQuality: 0.8,
  })
  const toMedia = (item: ImageOrVideo) => ({
    mediaType,
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
): Promise<Image> {
  const mediaType = opts.mediaType || 'photo'
  const item = await openCameraFn({
    mediaType,
    width: opts.width,
    height: opts.height,
    freeStyleCropEnabled: opts.freeStyleCropEnabled,
    cropperCircleOverlay: opts.cropperCircleOverlay,
    cropping: false,
    forceJpg: true, // ios only
    compressImageQuality: 0.8,
  })
  return {
    mediaType,
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
): Promise<Image> {
  const mediaType = opts.mediaType || 'photo'

  const item = await openCropperFn({
    ...opts,
    mediaType,
    forceJpg: true, // ios only
    compressImageQuality: 0.8,
  })

  return {
    mediaType,
    path: item.path,
    mime: item.mime,
    size: item.size,
    width: item.width,
    height: item.height,
  }
}
