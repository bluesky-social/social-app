import {type GestureResponderEvent, Keyboard} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {getHomeNavigationAction} from '#/lib/routes/navigation'
import {type NavigationProp} from '#/lib/routes/types'
import {useSetDrawerOpen} from '#/state/shell'
import {useAnalytics} from '#/analytics'

/**
 * What the header's back button does: run `onPress`, then go back unless it
 * called `preventDefault()`. With nothing to go back to (e.g. a deep link
 * opened straight onto this screen), go home instead.
 */
export function useHeaderBack(onPress?: (evt: GestureResponderEvent) => void) {
  const navigation = useNavigation<NavigationProp>()
  return (evt: GestureResponderEvent) => {
    onPress?.(evt)
    if (evt.defaultPrevented) return
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.dispatch(
        getHomeNavigationAction(navigation.getState(), 'navigate'),
      )
    }
  }
}

/**
 * What the header's menu button does: open the drawer.
 */
export function useHeaderOpenDrawer() {
  const ax = useAnalytics()
  const setDrawerOpen = useSetDrawerOpen()
  return () => {
    ax.metric('nav:click', {item: 'menu', surface: 'topBar'})
    Keyboard.dismiss()
    setDrawerOpen(true)
  }
}
