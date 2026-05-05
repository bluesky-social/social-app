import {
  type ImagePickerOptions,
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'
import {t} from '@lingui/core/macro'

import {type ImageMeta} from '#/state/gallery'
import * as Toast from '#/components/Toast'
import {IS_IOS, IS_WEB} from '#/env'
import {VIDEO_MAX_DURATION_MS} from '../constants'
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
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Automatic,
  })

  return (response.assets ?? [])
    .filter(asset => {
      if (asset.mimeType?.startsWith('image/')) return true
      Toast.show(t`Only image files are supported`, {
        type: 'warning',
      })
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

export async function openUnifiedPicker({
  selectionCountRemaining,
}: {
  selectionCountRemaining: number
}) {
  return await launchImageLibraryAsync({
    exif: false,
    mediaTypes: ['images', 'videos'],
    quality: 1,
    allowsMultipleSelection: true,
    legacy: true,
    base64: IS_WEB,
    selectionLimit: IS_IOS ? selectionCountRemaining : undefined,
    // important: anything other than `Current` can cause the image picker to appear
    // to hang after selecting a video as it might attempt to silently transcode it before
    // returning anything, which can take ages. -sfn
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Current,
    videoMaxDuration: VIDEO_MAX_DURATION_MS / 1000,
  })
}
