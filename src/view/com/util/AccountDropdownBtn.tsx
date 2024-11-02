import React from 'react'
import {Pressable} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'
import {SessionAccount, useSessionApi} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '../../com/util/Toast'
import {DropdownItem, NativeDropdown} from './forms/NativeDropdown'

export function AccountDropdownBtn({account}: {account: SessionAccount}) {
  const pal = usePalette('default')
  const {removeAccount} = useSessionApi()
  const removePromptControl = useDialogControl()
  const {_} = useLingui()

  const items: DropdownItem[] = [
    {
      label: _(msg`Remove account`),
      onPress: removePromptControl.open,
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
    <>
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
      <Prompt.Basic
        control={removePromptControl}
        title={_(msg`Remove from quick access?`)}
        description={_(
          msg`This will remove @${account.handle} from the quick access list.`,
        )}
        onConfirm={() => {
          removeAccount(account)
          Toast.show(_(msg`Account removed from quick access`))
        }}
        confirmButtonCta={_(msg`Remove`)}
        confirmButtonColor="negative"
      />
    </>
  )
}
