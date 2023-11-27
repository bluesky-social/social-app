import {useCallback} from 'react'
import {useNavigation} from '@react-navigation/native'

import {isWeb} from '#/platform/detection'
import {NavigationProp} from '#/lib/routes/types'
import {useAnalytics} from '#/lib/analytics/analytics'
import {useSessionApi, SessionAccount} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useCloseAllActiveElements} from '#/state/util'

export function useAccountSwitcher() {
  const {track} = useAnalytics()
  const {selectAccount, clearCurrentAccount} = useSessionApi()
  const closeAllActiveElements = useCloseAllActiveElements()
  const navigation = useNavigation<NavigationProp>()

  const onPressSwitchAccount = useCallback(
    async (acct: SessionAccount) => {
      track('Settings:SwitchAccountButtonClicked')

      try {
        closeAllActiveElements()
        navigation.navigate(isWeb ? 'Home' : 'HomeTab')
        await selectAccount(acct)
        Toast.show(`Signed in as ${acct.handle}`)
      } catch (e) {
        Toast.show('Sorry! We need you to enter your password.')
        clearCurrentAccount() // back user out to login
      }
    },
    [
      track,
      clearCurrentAccount,
      selectAccount,
      closeAllActiveElements,
      navigation,
    ],
  )

  return {onPressSwitchAccount}
}
