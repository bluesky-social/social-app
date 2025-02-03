import {ImageSourcePropType} from 'react-native'

export type AppIconSet = {
  id: string
  name: string
  iosImage: () => ImageSourcePropType
  androidImage: () => ImageSourcePropType
}
