import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
  const {_} = useLingui()
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
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Switch Account`)}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            <Trans>Switch Account</Trans>
          </Text>

          <AccountList
            onSelectAccount={onSelectAccount}
            onSelectOther={onPressAddAccount}
            otherLabel={_(msg`Add account`)}
            pendingDid={pendingDid}
          />
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
