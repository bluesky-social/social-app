import {
  ImagePickerOptions,
  launchImageLibraryAsync,
  MediaTypeOptions,
} from 'expo-image-picker'
import {getDataUriSize} from './util'
import * as Toast from 'view/com/util/Toast'

export async function openPicker(opts?: ImagePickerOptions) {
  const response = await launchImageLibraryAsync({
    exif: false,
    mediaTypes: MediaTypeOptions.Images,
    quality: 1,
    ...opts,
  })

  if (response.assets && response.assets.length > 4) {
    Toast.show('You may only select up to 4 images')
  }

  return (response.assets ?? []).slice(0, 4).map(image => ({
    mime: 'image/jpeg',
    height: image.height,
    width: image.width,
    path: image.uri,
    size: getDataUriSize(image.uri),
  }))
}
