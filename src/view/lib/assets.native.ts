import {ImageSourcePropType} from 'react-native'

export const AVIS: Record<string, ImageSourcePropType> = {
  'alice.com': require('../../../public/img/alice.jpg'),
  'bob.com': require('../../../public/img/bob.jpg'),
  'carla.com': require('../../../public/img/carla.jpg'),
}

export const BANNER: ImageSourcePropType = require('../../../public/img/banner.jpg')
