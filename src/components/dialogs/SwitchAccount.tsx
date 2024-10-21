import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function SwitchAccountDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const [editing, setEditing] = useState(false)

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
        <View style={[a.gap_sm]}>
          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.align_center,
              a.flex_wrap,
            ]}>
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Switch Account</Trans>
            </Text>

            <Button
              label={editing ? _(msg`Done`) : _(msg`Edit`)}
              onPress={() => setEditing(!editing)}
              variant="ghost"
              color="secondary"
              size="small">
              <ButtonText>{editing ? _(msg`Done`) : _(msg`Edit`)}</ButtonText>
            </Button>
          </View>

          <AccountList
            onSelectAccount={onSelectAccount}
            onSelectOther={onPressAddAccount}
            otherLabel={_(msg`Add account`)}
            pendingDid={pendingDid}
            editing={editing}
          />
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
