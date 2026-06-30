import {type ImageSourcePropType} from 'react-native'
import type * as DynamicAppIcon from '@bsky.app/expo-dynamic-app-icon'

export type AppIconSet = {
  id: DynamicAppIcon.IconName
  name: string
  iosImage: () => ImageSourcePropType
  androidImage: () => ImageSourcePropType
}
