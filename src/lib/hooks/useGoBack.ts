import {useNavigation} from '@react-navigation/native'

import {getHomeNavigationAction} from '#/lib/routes/navigation'
import {type NavigationProp} from '#/lib/routes/types'

export function useGoBack(onGoBack?: () => unknown) {
  const navigation = useNavigation<NavigationProp>()
  return () => {
    onGoBack?.()
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.dispatch(getHomeNavigationAction(navigation.getState()))
    }
  }
}
