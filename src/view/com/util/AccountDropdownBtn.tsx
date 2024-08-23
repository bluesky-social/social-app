import React from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {SessionAccount, useSessionApi} from '#/state/session'
import {HITSLOP_10} from 'lib/constants'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {DotGrid_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import * as Toast from '../../com/util/Toast'

export function AccountDropdownBtn({account}: {account: SessionAccount}) {
  const {_} = useLingui()
  const {removeAccount} = useSessionApi()
  const removePromptControl = useDialogControl()

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(`Account options`)}>
          {({props}) => {
            return (
              <Button
                {...props}
                testID="accountSettingsDropdownBtn"
                label={_(`Account options`)}
                hitSlop={HITSLOP_10}
                size="xsmall"
                shape="round"
                color="secondary"
                variant="ghost">
                <ButtonIcon icon={Ellipsis} size="sm" />
              </Button>
            )
          }}
        </Menu.Trigger>

        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Group>
            <Menu.Item
              label={_(msg`Remove account`)}
              onPress={() => {
                removePromptControl.open()
              }}>
              <Menu.ItemText>
                <Trans>Remove account</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Trash} />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>

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
