import {
  type ImagePickerOptions,
  launchImageLibraryAsync,
} from 'expo-image-picker'
import {t} from '@lingui/macro'

import {type ImageMeta} from '#/state/gallery'
import * as Toast from '#/view/com/util/Toast'
import {getDataUriSize} from './util'

export type PickerImage = ImageMeta & {
  size: number
}

export async function openPicker(opts?: ImagePickerOptions) {
  const response = await launchImageLibraryAsync({
    exif: false,
    mediaTypes: ['images'],
    quality: 1,
    selectionLimit: 1,
    ...opts,
    legacy: true,
  })

  return (response.assets ?? [])
    .filter(asset => {
      if (asset.mimeType?.startsWith('image/')) return true
      Toast.show(t`Only image files are supported`, 'exclamation-circle')
      return false
    })
    .map(image => ({
      mime: image.mimeType || 'image/jpeg',
      height: image.height,
      width: image.width,
      path: image.uri,
      size: getDataUriSize(image.uri),
    }))
}
