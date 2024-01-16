import React from 'react'
import {Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {DropdownItem, NativeDropdown} from './forms/NativeDropdown'
import * as Toast from '../../com/util/Toast'
import {useSessionApi, SessionAccount} from '#/state/session'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

export function AccountDropdownBtn({account}: {account: SessionAccount}) {
  const pal = usePalette('default')
  const {removeAccount} = useSessionApi()
  const {_} = useLingui()

  const items: DropdownItem[] = [
    {
      label: _(msg`Remove account`),
      onPress: () => {
        removeAccount(account)
        Toast.show(_(msg`Account removed from quick access`))
      },
      icon: {
        ios: {
          name: 'trash',
        },
        android: 'ic_delete',
        web: ['far', 'trash-can'],
      },
    },
  ]
  return (
    <Pressable accessibilityRole="button" style={s.pl10}>
      <NativeDropdown
        testID="accountSettingsDropdownBtn"
        items={items}
        accessibilityLabel={_(msg`Account options`)}
        accessibilityHint="">
        <FontAwesomeIcon
          icon="ellipsis-h"
          style={pal.textLight as FontAwesomeIconStyle}
        />
      </NativeDropdown>
    </Pressable>
  )
}
