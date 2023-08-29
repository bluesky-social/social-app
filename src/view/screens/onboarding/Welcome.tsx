import React from 'react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {HomeTabNavigatorParams} from 'lib/routes/types'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {Welcome} from 'view/com/auth/onboarding/Welcome'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Welcome'>
export const WelcomeScreen = observer(({navigation}: Props) => {
  const store = useStores()

  // make sure bottom nav is hidden
  React.useEffect(() => {
    if (!store.shell.minimalShellMode) {
      store.shell.setMinimalShellMode(true)
    }
  }, [store.shell.minimalShellMode, store])

  const next = () => {
    const nextScreenName = store.onboarding.next('Welcome')
    if (nextScreenName) {
      navigation.navigate(nextScreenName)
    }
  }

  const skip = () => {
    store.onboarding.skip()
    navigation.navigate('Home')
  }

  return <Welcome next={next} skip={skip} />
})
