import {RootStoreModel} from 'state/index'
import {PickerOpts, CameraOpts, CropperOpts, PickedMedia} from './types'
import {
  scaleDownDimensions,
  Dim,
  compressIfNeeded,
  moveToPremanantPath,
} from 'lib/media/manip'
export type {PickedMedia} from './types'
import RNFS from 'react-native-fs'

let _imageCounter = 0
async function getFile() {
  const files = await RNFS.readDir(
    RNFS.LibraryDirectoryPath.split('/')
      .slice(0, -5)
      .concat(['Media', 'DCIM', '100APPLE'])
      .join('/'),
  )
  return files[_imageCounter++ % files.length]
}

export async function openPicker(
  _store: RootStoreModel,
  opts: PickerOpts,
): Promise<PickedMedia[]> {
  const mediaType = opts.mediaType || 'photo'
  const items = await getFile()
  const toMedia = (item: RNFS.ReadDirItem) => ({
    mediaType,
    path: item.path,
    mime: 'image/jpeg',
    size: item.size,
    width: 4288,
    height: 2848,
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
  const item = await getFile()
  return {
    mediaType,
    path: item.path,
    mime: 'image/jpeg',
    size: item.size,
    width: 4288,
    height: 2848,
  }
}

export async function openCropper(
  _store: RootStoreModel,
  opts: CropperOpts,
): Promise<PickedMedia> {
  const mediaType = opts.mediaType || 'photo'
  const item = await getFile()
  return {
    mediaType,
    path: item.path,
    mime: 'image/jpeg',
    size: item.size,
    width: 4288,
    height: 2848,
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
