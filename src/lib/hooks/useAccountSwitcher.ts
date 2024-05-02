import {useCallback, useState} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {SessionAccount, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {logEvent} from '../statsig/statsig'
import {LogEvents} from '../statsig/statsig'

export function useAccountSwitcher() {
  const [isSwitchingAccounts, setIsSwitchingAccounts] = useState(false)
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {initSession, clearCurrentAccount} = useSessionApi()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const onPressSwitchAccount = useCallback(
    async (
      account: SessionAccount,
      logContext: LogEvents['account:loggedIn']['logContext'],
    ) => {
      track('Settings:SwitchAccountButtonClicked')

      try {
        setIsSwitchingAccounts(true)
        if (account.accessJwt) {
          if (isWeb) {
            // We're switching accounts, which remounts the entire app.
            // On mobile, this gets us Home, but on the web we also need reset the URL.
            // We can't change the URL via a navigate() call because the navigator
            // itself is about to unmount, and it calls pushState() too late.
            // So we change the URL ourselves. The navigator will pick it up on remount.
            history.pushState(null, '', '/')
          }
          await initSession(account)
          logEvent('account:loggedIn', {logContext, withPassword: false})
          setTimeout(() => {
            Toast.show(_(msg`Signed in as @${account.handle}`))
          }, 100)
        } else {
          requestSwitchToAccount({requestedAccount: account.did})
          Toast.show(
            _(msg`Please sign in as @${account.handle}`),
            'circle-exclamation',
          )
        }
      } catch (e: any) {
        logger.error(`switch account: selectAccount failed`, {
          message: e.message,
        })
        clearCurrentAccount() // back user out to login
        setTimeout(() => {
          Toast.show(_(msg`Sorry! We need you to enter your password.`))
        }, 100)
      } finally {
        setIsSwitchingAccounts(false)
      }
    },
    [_, track, clearCurrentAccount, initSession, requestSwitchToAccount],
  )

  return {onPressSwitchAccount, isSwitchingAccounts}
}
