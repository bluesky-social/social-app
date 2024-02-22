import {Image as RNImage} from 'react-native-image-crop-picker'
import {readDirectoryAsync, getInfoAsync} from 'expo-file-system'
import {CropperOptions} from './types'
import {compressIfNeeded} from './manip'
import * as FS from 'expo-file-system'

let _imageCounter = 0
async function getFile() {
  // This *should* work. In RNFS, there was a LibraryDirectoryPath constant, which is not present in
  // expo-file-system. This should work as a work around at least on simulators (probably elsewhere
  // too though). Since this is only used for e2e though, this should be safe.
  const libraryDirPath = FS.documentDirectory?.split('/data/')[0] + '/data'

  let paths = await readDirectoryAsync(
    libraryDirPath
      .split('/')
      .slice(0, -5)
      .concat(['Media', 'DCIM', '100APPLE'])
      .join('/'),
  )
  paths = paths.filter(path => path.endsWith('.JPG'))
  const path = paths[_imageCounter++ % paths.length]
  return await compressIfNeeded({
    path,
    mime: 'image/jpeg',
    // @ts-ignore Size is available, not sure what is wrong with this type
    size: (await getInfoAsync(path, {size: true})).size ?? 0,
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

export async function openCropper(opts: CropperOptions): Promise<RNImage> {
  return {
    path: opts.path,
    mime: 'image/jpeg',
    size: 123,
    width: 4288,
    height: 2848,
  }
}
