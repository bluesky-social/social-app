import {
  Image,
  NativeSyntheticEvent,
  ImageLoadEventData,
  ImageSourcePropType,
} from 'react-native'
export default Image
export const HighPriorityImage = Image
export type OnLoadEvent = NativeSyntheticEvent<ImageLoadEventData>
export type Source = ImageSourcePropType
export type {ImageStyle} from 'react-native'
