import {useCallback} from 'react'
import {useNavigation} from '@react-navigation/native'

import {isWeb} from '#/platform/detection'
import {NavigationProp} from '#/lib/routes/types'
import {useAnalytics} from '#/lib/analytics/analytics'
import {useSessionApi, SessionAccount} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useCloseAllActiveElements} from '#/state/util'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'

export function useAccountSwitcher() {
  const {track} = useAnalytics()
  const {selectAccount, clearCurrentAccount} = useSessionApi()
  const closeAllActiveElements = useCloseAllActiveElements()
  const navigation = useNavigation<NavigationProp>()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onPressSwitchAccount = useCallback(
    async (account: SessionAccount) => {
      track('Settings:SwitchAccountButtonClicked')

      try {
        if (account.accessJwt) {
          closeAllActiveElements()
          navigation.navigate(isWeb ? 'Home' : 'HomeTab')
          await selectAccount(account)
          setTimeout(() => {
            Toast.show(`Signed in as @${account.handle}`)
          }, 100)
        } else {
          setShowLoggedOut(true)
          Toast.show(
            `Please sign in as @${account.handle}`,
            'circle-exclamation',
          )
        }
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
      setShowLoggedOut,
    ],
  )

  return {onPressSwitchAccount}
}
