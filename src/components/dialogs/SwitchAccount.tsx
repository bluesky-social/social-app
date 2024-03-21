import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {AccountItem} from '#/screens/Login/ChooseAccountForm'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {ChevronRight_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {Loader} from '#/components/Loader'
import {Button} from '../Button'
import {Text} from '../Typography'

export function SwitchAccountDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isSwitchingAccounts, currentAccount, accounts} = useSession()
  const {onPressSwitchAccount} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const onSelectAccount = useCallback(
    (account: SessionAccount) => {
      if (account.did === currentAccount?.did) {
        control.close()
      } else {
        onPressSwitchAccount(account, 'SwitchAccount')
      }
    },
    [currentAccount, control, onPressSwitchAccount],
  )

  const onPressAddAccount = useCallback(() => {
    setShowLoggedOut(true)
    closeAllActiveElements()
  }, [setShowLoggedOut, closeAllActiveElements])

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label={_(msg`Switch Account`)}>
        <View style={[a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Switch Account</Trans>
          </Text>
        </View>

        {isSwitchingAccounts ? (
          <Loader size="xl" />
        ) : (
          <View
            style={[
              a.rounded_md,
              a.overflow_hidden,
              a.border,
              t.atoms.border_contrast_low,
            ]}>
            {accounts.map(account => (
              <React.Fragment key={account.did}>
                <AccountItem
                  account={account}
                  onSelect={onSelectAccount}
                  isCurrentAccount={account.did === currentAccount?.did}
                />
                <View style={[a.border_b, t.atoms.border_contrast_low]} />
              </React.Fragment>
            ))}
            <Button
              testID="chooseAddAccountBtn"
              style={[a.flex_1]}
              onPress={onPressAddAccount}
              label={_(msg`Login to account that is not listed`)}>
              {({hovered, pressed}) => (
                <View
                  style={[
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    {height: 48},
                    (hovered || pressed) && t.atoms.bg_contrast_25,
                  ]}>
                  <Text
                    style={[
                      a.align_baseline,
                      a.flex_1,
                      a.flex_row,
                      a.py_sm,
                      {paddingLeft: 48},
                    ]}>
                    <Trans>Add account</Trans>
                  </Text>
                  <Chevron size="sm" style={[t.atoms.text, a.mr_md]} />
                </View>
              )}
            </Button>
          </View>
        )}

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
