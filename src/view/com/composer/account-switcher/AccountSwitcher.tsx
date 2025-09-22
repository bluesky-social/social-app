import {type AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {type SessionAccount, useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {SwitchAccountDialog} from '../SwitchAccount'

interface AccountSwitcherProps {
  selectedAccount: SessionAccount
  onSelectAccount: (account: SessionAccount) => void
  profiles: AppBskyActorDefs.ProfileViewDetailed[] | undefined
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  selectedAccount,
  onSelectAccount,
  profiles,
}) => {
  const {accounts} = useSession()
  const {_} = useLingui()
  const currentProfile = profiles?.find(p => p.did === selectedAccount.did)
  const otherAccounts = accounts
    .filter((acc: SessionAccount) => acc.did !== selectedAccount.did)
    .map((account: SessionAccount) => ({
      account,
      profile: profiles?.find(p => p.did === account.did),
    }))
  const switchAccountControl = Dialog.useDialogControl()

  return (
    <>
      <Button
        disabled={otherAccounts.length === 0}
        label={_(msg`Switch account`)}
        variant="ghost"
        color="primary"
        shape="round"
        onPress={switchAccountControl.open}>
        <UserAvatar
          avatar={currentProfile?.avatar}
          size={42}
          type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
        />
      </Button>
      <SwitchAccountDialog
        control={switchAccountControl}
        onSelectAccount={onSelectAccount}
        currentAccountDid={selectedAccount.did}
      />
    </>
  )
}
