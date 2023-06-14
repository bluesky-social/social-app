import {
  ImagePickerOptions,
  launchImageLibraryAsync,
  MediaTypeOptions,
} from 'expo-image-picker'
import {getDataUriSize} from './util'

export async function openPicker(opts?: ImagePickerOptions) {
  const response = await launchImageLibraryAsync({
    exif: false,
    mediaTypes: MediaTypeOptions.Images,
    quality: 1,
    ...opts,
  })

  return (response.assets ?? []).map(image => ({
    mime: 'image/jpeg',
    height: image.height,
    width: image.width,
    path: image.uri,
    size: getDataUriSize(image.uri),
  }))
}
