import {RootStoreModel} from 'state/index'
import {Image} from './types'
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

export async function openPicker(_store: RootStoreModel): Promise<Image[]> {
  const items = await getFile()
  const toMedia = (item: RNFS.ReadDirItem) => ({
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

export async function openCamera(_store: RootStoreModel): Promise<Image> {
  const item = await getFile()
  return {
    path: item.path,
    mime: 'image/jpeg',
    size: item.size,
    width: 4288,
    height: 2848,
  }
}
