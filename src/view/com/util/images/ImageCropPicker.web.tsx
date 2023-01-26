import type {
  Image,
  Video,
  ImageOrVideo,
  Options,
  PossibleArray,
} from 'react-native-image-crop-picker'

export type {Image} from 'react-native-image-crop-picker'

type MediaType<O> = O extends {mediaType: 'photo'}
  ? Image
  : O extends {mediaType: 'video'}
  ? Video
  : ImageOrVideo

export async function openPicker<O extends Options>(
  _options: O,
): Promise<PossibleArray<O, MediaType<O>>> {
  // TODO
  throw new Error('TODO')
}
export async function openCamera<O extends Options>(
  _options: O,
): Promise<PossibleArray<O, MediaType<O>>> {
  // TODO
  throw new Error('TODO')
}
export async function openCropper(_options: Options): Promise<Image> {
  // TODO
  throw new Error('TODO')
}
