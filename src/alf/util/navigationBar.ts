import * as NavigationBar from 'expo-navigation-bar'
import * as SystemUI from 'expo-system-ui'

import {isAndroid} from '#/platform/detection'
import {Theme} from '../types'

export function setNavigationBar(themeType: 'theme' | 'lightbox', t: Theme) {
  if (isAndroid) {
    if (themeType === 'theme') {
      NavigationBar.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
      NavigationBar.setBorderColorAsync(t.atoms.bg.backgroundColor)
      NavigationBar.setButtonStyleAsync(t.name !== 'light' ? 'light' : 'dark')
      SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
    } else {
      NavigationBar.setBackgroundColorAsync('black')
      NavigationBar.setBorderColorAsync('black')
      NavigationBar.setButtonStyleAsync('light')
      SystemUI.setBackgroundColorAsync('black')
    }
  }
}
