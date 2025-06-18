import * as SystemUI from 'expo-system-ui'

import {isAndroid} from '#/platform/detection'
import {type Theme} from '../types'

export function setSystemUITheme(themeType: 'theme' | 'lightbox', t: Theme) {
  if (isAndroid) {
    if (themeType === 'theme') {
      SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
    } else {
      SystemUI.setBackgroundColorAsync('black')
    }
  }
}
