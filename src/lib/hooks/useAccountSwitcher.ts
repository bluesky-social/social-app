import {useCallback, useState} from 'react'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics/analytics'
import {StackActions, useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {AccountData} from 'state/models/session'
import {reset as resetNavigation} from '../../Navigation'
import * as Toast from 'view/com/util/Toast'

export function useAccountSwitcher(): [
  boolean,
  (v: boolean) => void,
  (acct: AccountData) => Promise<void>,
] {
  const {track} = useAnalytics()

  const store = useStores()
  const [isSwitching, setIsSwitching] = useState(false)
  const navigation = useNavigation<NavigationProp>()

  const onPressSwitchAccount = useCallback(
    async (acct: AccountData) => {
      track('Settings:SwitchAccountButtonClicked')
      setIsSwitching(true)
      const success = await store.session.resumeSession(acct)
      store.shell.closeAllActiveElements()
      if (success) {
        resetNavigation()
        Toast.show(`Signed in as ${acct.displayName || acct.handle}`)
      } else {
        Toast.show('Sorry! We need you to enter your password.')
        navigation.navigate('HomeTab')
        navigation.dispatch(StackActions.popToTop())
        store.session.clear()
      }
    },
    [track, setIsSwitching, navigation, store],
  )

  return [isSwitching, setIsSwitching, onPressSwitchAccount]
}
