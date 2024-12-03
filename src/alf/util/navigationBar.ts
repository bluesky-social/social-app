import * as NavigationBar from 'expo-navigation-bar'

import {isAndroid} from '#/platform/detection'
import {Theme} from '../types'

export function setNavigationBar(themeType: 'theme' | 'lightbox', t: Theme) {
  if (isAndroid) {
    if (themeType === 'theme') {
      NavigationBar.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
      NavigationBar.setBorderColorAsync(t.atoms.bg.backgroundColor)
      NavigationBar.setButtonStyleAsync(t.name !== 'light' ? 'light' : 'dark')
    } else {
      NavigationBar.setBackgroundColorAsync('black')
      NavigationBar.setBorderColorAsync('black')
      NavigationBar.setButtonStyleAsync('light')
    }
  }
}
