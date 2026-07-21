import {Asset} from 'expo-asset'
import {
  documentDirectory,
  getInfoAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy'
import {type ImagePickerResult} from 'expo-image-picker'
import ExpoImageCropTool, {
  type OpenCropperOptions,
} from '@bsky.app/expo-image-crop-tool'

import {IMAGE_SIZE_CONFIG_2K_1MB} from '#/lib/constants'
import {IS_ANDROID} from '#/env'
import {compressIfNeeded} from './manip'
import {type PickerImage} from './picker.shared'

async function getFile() {
  if (IS_ANDROID) {
    return await getAndroidFile()
  }

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

  return await compressIfNeeded(
    {
      path: file,
      mime: 'image/jpeg',
      size: fileInfo.size,
      width: 4288,
      height: 2848,
    },
    IMAGE_SIZE_CONFIG_2K_1MB,
  )
}

/*
 * The Android emulator can't reach the iOS simulator's sample photo library,
 * so we load a jpg bundled with the app instead. It is bundled via require()
 * (resolved by Metro), so it survives `pm clear`, which Maestro's clearState
 * runs at the start of every flow. An adb-seeded file in app-scoped external
 * storage does not survive: pm clear wipes that directory each flow, so the
 * seeded file is gone before the picker mock ever reads it.
 */
async function getAndroidFile() {
  const asset = Asset.fromModule(
    require('../../../assets/images/welcome-modal-bg.jpg'),
  )
  await asset.downloadAsync()

  const path = asset.localUri!
  const fileInfo = await getInfoAsync(path)

  if (!fileInfo.exists) {
    throw new Error('Failed to get file info')
  }

  /*
   * Dimensions of the bundled asset (assets/images/welcome-modal-bg.jpg). Only
   * used for downstream aspect-ratio display; the actual bytes are read from
   * disk by compressIfNeeded.
   */
  return await compressIfNeeded(
    {
      path,
      mime: 'image/jpeg',
      size: fileInfo.size,
      width: 1432,
      height: 1025,
    },
    IMAGE_SIZE_CONFIG_2K_1MB,
  )
}

export async function openPicker(): Promise<PickerImage[]> {
  return [await getFile()]
}

export async function openUnifiedPicker(): Promise<ImagePickerResult> {
  const file = await getFile()

  return {
    assets: [
      {
        type: 'image',
        uri: file.path,
        mimeType: file.mime,
        ...file,
      },
    ],
    canceled: false,
  }
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
    mime: item.mimeType,
    size: item.size,
    width: item.width,
    height: item.height,
  }
}
