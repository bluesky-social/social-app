import {RootStoreModel} from 'state/index'
import {PickerOpts, CameraOpts, Image} from './types'
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
): Promise<Image[]> {
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
): Promise<Image> {
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
