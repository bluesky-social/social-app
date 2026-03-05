import {useCallback, useState} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {type SessionAccount, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {useAnalytics} from '#/analytics'
import {type Metrics} from '#/analytics/metrics'
import {IS_WEB} from '#/env'

export function useAccountSwitcher() {
  const ax = useAnalytics()
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {_} = useLingui()
  const {resumeSession} = useSessionApi()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const onPressSwitchAccount = useCallback(
    async (
      account: SessionAccount,
      logContext: Metrics['account:loggedIn']['logContext'],
    ) => {
      if (pendingDid) {
        // The session API isn't resilient to race conditions so let's just ignore this.
        return
      }
      try {
        setPendingDid(account.did)
        if (account.accessJwt) {
          if (IS_WEB) {
            // We're switching accounts, which remounts the entire app.
            // On mobile, this gets us Home, but on the web we also need reset the URL.
            // We can't change the URL via a navigate() call because the navigator
            // itself is about to unmount, and it calls pushState() too late.
            // So we change the URL ourselves. The navigator will pick it up on remount.
            history.pushState(null, '', '/')
          }
          await resumeSession(account, true)
          ax.metric('account:loggedIn', {logContext, withPassword: false})
          Toast.show(_(msg`Signed in as @${account.handle}`))
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
        requestSwitchToAccount({requestedAccount: account.did})
        Toast.show(
          _(msg`Please sign in as @${account.handle}`),
          'circle-exclamation',
        )
      } finally {
        setPendingDid(null)
      }
    },
    [_, ax, resumeSession, requestSwitchToAccount, pendingDid],
  )

  return {onPressSwitchAccount, pendingDid}
}
