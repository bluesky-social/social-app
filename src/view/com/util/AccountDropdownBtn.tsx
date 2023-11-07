import React from 'react'
import {Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {DropdownItem, NativeDropdown} from './forms/NativeDropdown'
import * as Toast from '../../com/util/Toast'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

export function AccountDropdownBtn({handle}: {handle: string}) {
  const store = useStores()
  const pal = usePalette('default')
  const {_} = useLingui()

  const items: DropdownItem[] = [
    {
      label: 'Remove account',
      onPress: () => {
        store.session.removeAccount(handle)
        Toast.show('Account removed from quick access')
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
