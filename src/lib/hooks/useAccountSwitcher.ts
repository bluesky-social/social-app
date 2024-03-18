import {useCallback} from 'react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {useSessionApi, SessionAccount} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useCloseAllActiveElements} from '#/state/util'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {LogEvents} from '../statsig/statsig'

export function useAccountSwitcher() {
  const {track} = useAnalytics()
  const {selectAccount, clearCurrentAccount} = useSessionApi()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const onPressSwitchAccount = useCallback(
    async (
      account: SessionAccount,
      logContext: LogEvents['account:loggedIn']['logContext'],
    ) => {
      track('Settings:SwitchAccountButtonClicked')

      try {
        if (account.accessJwt) {
          closeAllActiveElements()
          await selectAccount(account, logContext)
          setTimeout(() => {
            Toast.show(`Signed in as @${account.handle}`)
          }, 100)
        } else {
          closeAllActiveElements()
          requestSwitchToAccount({requestedAccount: account.did})
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
      requestSwitchToAccount,
    ],
  )

  return {onPressSwitchAccount}
}
