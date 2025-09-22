import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {sanitizeHandle} from '#/lib/strings/handles'
import {type SessionAccount, useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import * as Menu from '#/components/Menu'

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

  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Switch account`)}>
        {({props}) => (
          <Button
            {...props}
            disabled={otherAccounts.length === 0}
            label={_(msg`Switch account`)}
            variant="ghost"
            color="primary"
            shape="round">
            <UserAvatar
              avatar={currentProfile?.avatar}
              size={42}
              type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
            />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Switch account</Trans>
        </Menu.LabelText>
        <Menu.Group>
          {otherAccounts.map(({account, profile}) => (
            <Menu.Item
              style={[a.gap_sm, {minWidth: 150}]}
              key={account.did}
              label={_(
                msg`Switch to ${sanitizeHandle(
                  profile?.handle ?? account.handle,
                  '@',
                )}`,
              )}
              onPress={() => onSelectAccount(account)}>
              <View>
                <UserAvatar
                  avatar={profile?.avatar}
                  size={20}
                  type={profile?.associated?.labeler ? 'labeler' : 'user'}
                  hideLiveBadge
                />
              </View>
              <Menu.ItemText>
                {sanitizeHandle(profile?.handle ?? account.handle, '@')}
              </Menu.ItemText>
            </Menu.Item>
          ))}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
