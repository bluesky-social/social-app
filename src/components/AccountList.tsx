import React, {useCallback} from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfilesQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {useDialogContext} from './Dialog'

export function AccountList({
  onSelectAccount,
  onSelectOther,
  otherLabel,
  pendingDid,
  editing = false,
}: {
  onSelectAccount: (account: SessionAccount) => void
  onSelectOther: () => void
  otherLabel?: string
  pendingDid: string | null
  editing?: boolean
}) {
  const {currentAccount, accounts} = useSession()
  const t = useTheme()
  const {_} = useLingui()
  const {data: profiles} = useProfilesQuery({
    handles: accounts.map(acc => acc.did),
    keepPrevious: true,
  })

  const onPressAddAccount = useCallback(() => {
    onSelectOther()
  }, [onSelectOther])

  return (
    <View
      pointerEvents={pendingDid ? 'none' : 'auto'}
      style={[
        a.rounded_md,
        a.overflow_hidden,
        {borderWidth: 1},
        t.atoms.border_contrast_low,
      ]}>
      {accounts.map((account, i) => (
        <View
          key={account.did}
          style={
            i !== accounts.length - 1 && [
              {borderBottomWidth: 1},
              t.atoms.border_contrast_low,
            ]
          }>
          <AccountItem
            profile={profiles?.profiles.find(p => p.did === account.did)}
            account={account}
            onSelect={onSelectAccount}
            isCurrentAccount={account.did === currentAccount?.did}
            isPendingAccount={account.did === pendingDid}
            editing={editing}
          />
        </View>
      ))}
      {!editing && (
        <Button
          testID="chooseAddAccountBtn"
          style={[a.flex_1, {borderTopWidth: 1}, t.atoms.border_contrast_low]}
          onPress={pendingDid ? undefined : onPressAddAccount}
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
                {otherLabel ?? <Trans>Other account</Trans>}
              </Text>
              <ChevronIcon size="sm" style={[t.atoms.text, a.mr_md]} />
            </View>
          )}
        </Button>
      )}
    </View>
  )
}

function AccountItem({
  profile,
  account,
  onSelect,
  isCurrentAccount,
  isPendingAccount,
  editing,
}: {
  profile?: AppBskyActorDefs.ProfileViewDetailed
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
  isCurrentAccount: boolean
  isPendingAccount: boolean
  editing?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = useDialogContext()
  const {logoutCurrentAccount, removeAccount} = useSessionApi()

  const onPress = useCallback(() => {
    onSelect(account)
  }, [account, onSelect])

  const onPressRemove = useCallback(() => {
    if (isCurrentAccount) {
      control.close(() => {
        logoutCurrentAccount('AccountList')
      })
    } else {
      removeAccount(account)
    }
  }, [control, logoutCurrentAccount, removeAccount, account, isCurrentAccount])

  if (editing) {
    return (
      <AccountItemContent profile={profile} account={account}>
        <Button
          label={isCurrentAccount ? _(msg`Sign out`) : _(msg`Remove account`)}
          variant="outline"
          color="negative"
          size="tiny"
          style={[a.mr_md]}
          onPress={onPressRemove}>
          <ButtonText>
            {isCurrentAccount ? <Trans>Sign out</Trans> : <Trans>Remove</Trans>}
          </ButtonText>
        </Button>
      </AccountItemContent>
    )
  }

  return (
    <Button
      testID={`chooseAccountBtn-${account.handle}`}
      key={account.did}
      style={[a.flex_1]}
      onPress={onPress}
      label={
        isCurrentAccount
          ? _(msg`Continue as ${account.handle} (currently signed in)`)
          : _(msg`Sign in as ${account.handle}`)
      }>
      {({hovered, pressed}) => (
        <AccountItemContent
          highlight={hovered || pressed || isPendingAccount}
          profile={profile}
          account={account}>
          {isCurrentAccount ? (
            <CheckIcon
              size="sm"
              style={[{color: t.palette.positive_600}, a.mr_md]}
            />
          ) : (
            <ChevronIcon size="sm" style={[t.atoms.text, a.mr_md]} />
          )}
        </AccountItemContent>
      )}
    </Button>
  )
}

function AccountItemContent({
  highlight,
  profile,
  account,

  children,
}: {
  highlight?: boolean
  profile?: AppBskyActorDefs.ProfileViewDetailed
  account: SessionAccount
  children?: React.ReactNode
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.align_center,
        {height: 48},
        highlight && t.atoms.bg_contrast_25,
      ]}>
      <View style={a.p_md}>
        <UserAvatar avatar={profile?.avatar} size={24} />
      </View>
      <Text style={[a.align_baseline, a.flex_1, a.flex_row, a.py_sm]}>
        <Text emoji style={[a.font_bold]}>
          {sanitizeDisplayName(
            profile?.displayName || profile?.handle || account.handle,
          )}
        </Text>{' '}
        <Text emoji style={[t.atoms.text_contrast_medium]}>
          {sanitizeHandle(account.handle)}
        </Text>
      </Text>
      {children}
    </View>
  )
}
