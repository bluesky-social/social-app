import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type SessionAccount} from '#/state/session'
import {atoms as a} from '#/alf'
import {AccountList} from '#/components/AccountList'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function SwitchAccountDialog({
  control,
  onSelectAccount,
  currentAccountDid,
}: {
  control: Dialog.DialogControlProps
  onSelectAccount: (account: SessionAccount) => void
  currentAccountDid: string
}) {
  const {_} = useLingui()

  const onSelect = React.useCallback(
    (account: SessionAccount) => {
      if (account.did !== currentAccountDid) {
        control.close(() => {
          onSelectAccount(account)
        })
      } else {
        control.close()
      }
    },
    [currentAccountDid, control, onSelectAccount],
  )

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Switch Account`)}>
        <View style={[a.gap_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Switch Account</Trans>
          </Text>

          <AccountList
            onSelectAccount={onSelect}
            pendingDid={null}
            currentAccountDid={currentAccountDid}
            showAddAccount={false}
          />
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
