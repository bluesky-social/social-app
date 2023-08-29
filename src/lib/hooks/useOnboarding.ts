import React from 'react'
import {useStores} from 'state/index'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {isNative, isWeb} from 'platform/detection'

export function useOnboarding() {
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  React.useEffect(() => {
    if (store.onboarding.isActive) {
      if (isWeb) {
        store.shell.openModal({name: 'onboarding'})
        return
      }
      if (isNative) {
        navigation.navigate('Welcome')
        return
      }
    }
  }, [store.onboarding.isActive, navigation, store.shell])
}
