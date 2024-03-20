import {useCallback} from 'react'

import {isWeb} from '#/platform/detection'
import {useAnalytics} from '#/lib/analytics/analytics'
import {useSessionApi, SessionAccount} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useCloseAllActiveElements} from '#/state/util'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

export function useAccountSwitcher() {
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {selectAccount, clearCurrentAccount} = useSessionApi()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const onPressSwitchAccount = useCallback(
    async (account: SessionAccount) => {
      track('Settings:SwitchAccountButtonClicked')

      try {
        if (account.accessJwt) {
          closeAllActiveElements()
          if (isWeb) {
            // We're switching accounts, which remounts the entire app.
            // On mobile, this gets us Home, but on the web we also need reset the URL.
            // We can't change the URL via a navigate() call because the navigator
            // itself is about to unmount, and it calls pushState() too late.
            // So we change the URL ourselves. The navigator will pick it up on remount.
            history.pushState(null, '', '/')
          }
          await selectAccount(account)
          setTimeout(() => {
            Toast.show(_(msg`Signed in as @${account.handle}`))
          }, 100)
        } else {
          closeAllActiveElements()
          requestSwitchToAccount({requestedAccount: account.did})
          Toast.show(
            _(msg`Please sign in as @${account.handle}`),
            'circle-exclamation',
          )
        }
      } catch (e) {
        Toast.show(_(msg`Sorry! We need you to enter your password.`))
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
