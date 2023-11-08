import {useCallback, useState} from 'react'
import {useStores} from 'state/index'
import {useAnalytics} from 'lib/analytics/analytics'
import {StackActions, useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {AccountData} from 'state/models/session'
import {reset as resetNavigation} from '../../Navigation'
import * as Toast from 'view/com/util/Toast'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useModalControls} from '#/state/modals'

export function useAccountSwitcher(): [
  boolean,
  (v: boolean) => void,
  (acct: AccountData) => Promise<void>,
] {
  const {track} = useAnalytics()
  const store = useStores()
  const setDrawerOpen = useSetDrawerOpen()
  const {closeModal} = useModalControls()
  const [isSwitching, setIsSwitching] = useState(false)
  const navigation = useNavigation<NavigationProp>()

  const onPressSwitchAccount = useCallback(
    async (acct: AccountData) => {
      track('Settings:SwitchAccountButtonClicked')
      setIsSwitching(true)
      const success = await store.session.resumeSession(acct)
      setDrawerOpen(false)
      closeModal()
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
    [track, setIsSwitching, navigation, store, setDrawerOpen, closeModal],
  )

  return [isSwitching, setIsSwitching, onPressSwitchAccount]
}
