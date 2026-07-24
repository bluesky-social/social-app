import {useCallback} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {AccountList} from '../AccountList'
import {Text} from '../Typography'

export function SwitchAccountDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onSelectAccount = useCallback(
    (account: SessionAccount) => {
      if (account.did !== currentAccount?.did) {
        control.close(() => {
          onPressSwitchAccount(account, 'SwitchAccount')
        })
      } else {
        control.close()
      }
    },
    [currentAccount, control, onPressSwitchAccount],
  )

  const onPressAddAccount = useCallback(() => {
    control.close(() => {
      setShowLoggedOut(true)
    })
  }, [setShowLoggedOut, control])

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Switch account`}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            <Trans>Switch account</Trans>
          </Text>

          <AccountList
            onSelectAccount={onSelectAccount}
            onSelectOther={onPressAddAccount}
            otherLabel={l`Add account`}
            pendingDid={pendingDid}
          />
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
