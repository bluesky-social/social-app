import {useCallback} from 'react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {useStores} from '#/state/index'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useModalControls} from '#/state/modals'
import {useSessionApi, SessionAccount} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'

export function useAccountSwitcher() {
  const {track} = useAnalytics()
  const store = useStores()
  const setDrawerOpen = useSetDrawerOpen()
  const {closeModal} = useModalControls()
  const {selectAccount, clearCurrentAccount} = useSessionApi()

  const onPressSwitchAccount = useCallback(
    async (acct: SessionAccount) => {
      track('Settings:SwitchAccountButtonClicked')

      try {
        await selectAccount(acct)
        setDrawerOpen(false)
        closeModal()
        store.shell.closeAllActiveElements()
        Toast.show(`Signed in as ${acct.handle}`)
      } catch (e) {
        Toast.show('Sorry! We need you to enter your password.')
        clearCurrentAccount() // back user out to login
      }
    },
    [
      track,
      store,
      setDrawerOpen,
      closeModal,
      clearCurrentAccount,
      selectAccount,
    ],
  )

  return {onPressSwitchAccount}
}
