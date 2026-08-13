import {type ImageSource} from 'expo-image'
import type * as DynamicAppIcon from '@bsky.app/expo-dynamic-app-icon'

export type AppIconSet = {
  id: DynamicAppIcon.IconName
  name: string
  iosImage: () => ImageSource
  androidImage: () => ImageSource
}
