import * as SystemUI from 'expo-system-ui'
import {type Theme} from '@bsky.app/alf'

import {isAndroid} from '#/platform/detection'

export function setSystemUITheme(themeType: 'theme' | 'lightbox', t: Theme) {
  if (isAndroid) {
    if (themeType === 'theme') {
      SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
    } else {
      SystemUI.setBackgroundColorAsync('black')
    }
  }
}
