import {SystemBars} from 'react-native-edge-to-edge'
import * as SystemUI from 'expo-system-ui'

import {isAndroid} from '#/platform/detection'
import {Theme} from '../types'

export function setNavigationBar(themeType: 'theme' | 'lightbox', t: Theme) {
  if (isAndroid) {
    if (themeType === 'theme') {
      const navigationBar = t.name !== 'light' ? 'light' : 'dark'
      SystemBars.pushStackEntry({style: {navigationBar}})
      SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
    } else {
      SystemBars.pushStackEntry({style: {navigationBar: 'light'}})
      SystemUI.setBackgroundColorAsync('black')
    }
  }
}
