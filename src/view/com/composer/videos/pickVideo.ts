import {
  ImagePickerAsset,
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'

import {VIDEO_MAX_DURATION_MS} from '#/lib/constants'

export async function pickVideo() {
  return await launchImageLibraryAsync({
    exif: false,
    mediaTypes: ['videos'],
    quality: 1,
    legacy: true,
    preferredAssetRepresentationMode:
      UIImagePickerPreferredAssetRepresentationMode.Current,
    videoMaxDuration: VIDEO_MAX_DURATION_MS / 1000,
  })
}

export const getVideoMetadata = (_file: File): Promise<ImagePickerAsset> => {
  throw new Error('getVideoMetadata is web only')
}
