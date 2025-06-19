import {
  documentDirectory,
  getInfoAsync,
  readDirectoryAsync,
} from 'expo-file-system'
import ExpoImageCropTool, {type OpenCropperOptions} from 'expo-image-crop-tool'

import {compressIfNeeded} from './manip'
import {type PickerImage} from './picker.shared'

async function getFile() {
  const imagesDir = documentDirectory!
    .split('/')
    .slice(0, -6)
    .concat(['Media', 'DCIM', '100APPLE'])
    .join('/')

  let files = await readDirectoryAsync(imagesDir)
  files = files.filter(file => file.endsWith('.JPG'))
  const file = `${imagesDir}/${files[0]}`

  const fileInfo = await getInfoAsync(file)

  if (!fileInfo.exists) {
    throw new Error('Failed to get file info')
  }

  return await compressIfNeeded({
    path: file,
    mime: 'image/jpeg',
    size: fileInfo.size,
    width: 4288,
    height: 2848,
  })
}

export async function openPicker(): Promise<PickerImage[]> {
  return [await getFile()]
}

export async function openCamera(): Promise<PickerImage> {
  return await getFile()
}

export async function openCropper(opts: OpenCropperOptions) {
  const item = await ExpoImageCropTool.openCropperAsync({
    ...opts,
    format: 'jpeg',
  })

  return {
    path: item.path,
    mime: item.mime,
    size: item.size,
    width: item.width,
    height: item.height,
  }
}
