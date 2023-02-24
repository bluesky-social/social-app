import {
  openPicker as openPickerFn,
  openCamera as openCameraFn,
  openCropper as openCropperFn,
  ImageOrVideo,
} from 'react-native-image-crop-picker'
import {RootStoreModel} from 'state/index'
import {PickerOpts, CameraOpts, CropperOpts, PickedMedia} from './types'
import {
  scaleDownDimensions,
  Dim,
  compressIfNeeded,
  moveToPremanantPath,
} from 'lib/media/manip'
export type {PickedMedia} from './types'

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
): Promise<PickedMedia[]> {
  const mediaType = opts.mediaType || 'photo'
  const items = await openPickerFn({
    mediaType,
    multiple: opts.multiple,
    maxFiles: opts.maxFiles,
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
): Promise<PickedMedia> {
  const mediaType = opts.mediaType || 'photo'
  const item = await openCameraFn({
    mediaType,
    width: opts.width,
    height: opts.height,
    freeStyleCropEnabled: opts.freeStyleCropEnabled,
    cropperCircleOverlay: opts.cropperCircleOverlay,
    cropping: true,
    forceJpg: true, // ios only
    compressImageQuality: 1.0,
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
  opts: CropperOpts,
): Promise<PickedMedia> {
  const mediaType = opts.mediaType || 'photo'
  const item = await openCropperFn({
    path: opts.path,
    mediaType: opts.mediaType || 'photo',
    width: opts.width,
    height: opts.height,
    freeStyleCropEnabled: opts.freeStyleCropEnabled,
    cropperCircleOverlay: opts.cropperCircleOverlay,
    forceJpg: true, // ios only
    compressImageQuality: 1.0,
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

export async function pickImagesFlow(
  store: RootStoreModel,
  maxFiles: number,
  maxDim: Dim,
  maxSize: number,
) {
  const items = await openPicker(store, {
    multiple: true,
    maxFiles,
    mediaType: 'photo',
  })
  const result = []
  for (const image of items) {
    result.push(
      await cropAndCompressFlow(store, image.path, image, maxDim, maxSize),
    )
  }
  return result
}

export async function cropAndCompressFlow(
  store: RootStoreModel,
  path: string,
  imgDim: Dim,
  maxDim: Dim,
  maxSize: number,
) {
  // choose target dimensions based on the original
  // this causes the photo cropper to start with the full image "selected"
  const {width, height} = scaleDownDimensions(imgDim, maxDim)
  const cropperRes = await openCropper(store, {
    mediaType: 'photo',
    path,
    freeStyleCropEnabled: true,
    width,
    height,
  })

  const img = await compressIfNeeded(cropperRes, maxSize)
  const permanentPath = await moveToPremanantPath(img.path)
  return permanentPath
}
