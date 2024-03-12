import {
  Image,
  ImageLoadEventData,
  ImageSourcePropType,
  NativeSyntheticEvent,
} from 'react-native'
export default Image
export const HighPriorityImage = Image
export type OnLoadEvent = NativeSyntheticEvent<ImageLoadEventData>
export type Source = ImageSourcePropType
export type {ImageStyle} from 'react-native'
