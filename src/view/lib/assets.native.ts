import {ImageSourcePropType} from 'react-native'

export const AVIS: Record<string, ImageSourcePropType> = {
  'alice.test': require('../../../public/img/alice.jpg'),
  'bob.test': require('../../../public/img/bob.jpg'),
  'carol.test': require('../../../public/img/carla.jpg'),
}

export const BANNER: ImageSourcePropType = require('../../../public/img/banner.jpg')
