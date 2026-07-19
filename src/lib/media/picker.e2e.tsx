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

/*
 * The Android emulator can't reach the iOS simulator's sample photo library,
 * so run-nightly-e2e.sh seeds a single jpg into the app's external files
 * directory before the flows run. That directory is world-readable via the
 * emulator's sdcardfs, so expo-file-system can read it without any runtime
 * media permission (unlike /sdcard/DCIM, which is gated behind scoped storage
 * on target SDK 35).
 */
const ANDROID_E2E_MEDIA_DIR =
  'file:///sdcard/Android/data/xyz.blueskyweb.app/files/e2e'

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

async function getAndroidFile() {
  let files = await readDirectoryAsync(ANDROID_E2E_MEDIA_DIR)
  files = files.filter(file => file.toLowerCase().endsWith('.jpg'))
  const file = `${ANDROID_E2E_MEDIA_DIR}/${files[0]}`

  const fileInfo = await getInfoAsync(file)

  if (!fileInfo.exists) {
    throw new Error('Failed to get file info')
  }

  /*
   * Dimensions of the seeded asset (assets/images/welcome-modal-bg.jpg). Only
   * used for downstream aspect-ratio display; the actual bytes are read from
   * disk by compressIfNeeded.
   */
  return await compressIfNeeded(
    {
      path: file,
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
