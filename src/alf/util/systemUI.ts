import * as SystemUI from 'expo-system-ui'
import {type Theme} from '@bsky.app/alf'

import {logger} from '#/logger'
import {isAndroid} from '#/platform/detection'

export function setSystemUITheme(themeType: 'theme' | 'lightbox', t: Theme) {
  if (isAndroid) {
    try {
      if (themeType === 'theme') {
        SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
      } else {
        SystemUI.setBackgroundColorAsync('black')
      }
    } catch (error) {
      // Can reject with 'The current activity is no longer available' - no big deal
      logger.debug('Could not set system UI theme', {safeMessage: error})
    }
  }
}
