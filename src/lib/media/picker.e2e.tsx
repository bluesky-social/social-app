import RNFS from 'react-native-fs'
import {
  Image as RNImage,
  openCropper as openCropperFn,
} from 'react-native-image-crop-picker'

import {compressIfNeeded} from './manip'
import {CropperOptions} from './types'

async function getFile() {
  let files = await RNFS.readDir(
    RNFS.LibraryDirectoryPath.split('/')
      .slice(0, -5)
      .concat(['Media', 'DCIM', '100APPLE'])
      .join('/'),
  )
  files = files.filter(file => file.path.endsWith('.JPG'))
  const file = files[0]
  return await compressIfNeeded({
    path: file.path,
    mime: 'image/jpeg',
    size: file.size,
    width: 4288,
    height: 2848,
  })
}

export async function openPicker(): Promise<RNImage[]> {
  return [await getFile()]
}

export async function openCamera(): Promise<RNImage> {
  return await getFile()
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
