import {RootStoreModel} from 'state/index'
import {Image as RNImage} from 'react-native-image-crop-picker'
import RNFS from 'react-native-fs'
import {CropperOptions} from './types'
import {compressIfNeeded} from './manip'

let _imageCounter = 0
async function getFile() {
  const files = await RNFS.readDir(
    RNFS.LibraryDirectoryPath.split('/')
      .slice(0, -5)
      .concat(['Media', 'DCIM', '100APPLE'])
      .join('/'),
  )
  const file = files[_imageCounter++ % files.length]
  return await compressIfNeeded({
    path: file.path,
    mime: 'image/jpeg',
    size: file.size,
    width: 4288,
    height: 2848,
  })
}

export async function openPicker(_store: RootStoreModel): Promise<RNImage[]> {
  return [await getFile()]
}

export async function openCamera(_store: RootStoreModel): Promise<RNImage> {
  return await getFile()
}

export async function openCropper(
  _store: RootStoreModel,
  opts: CropperOptions,
): Promise<RNImage> {
  return {
    path: opts.path,
    mime: 'image/jpeg',
    size: 123,
    width: 4288,
    height: 2848,
  }
}
