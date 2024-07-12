import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {ChevronRight_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {Button} from './Button'
import {Text} from './Typography'

export function AccountList({
  onSelectAccount,
  onSelectOther,
  otherLabel,
  pendingDid,
}: {
  onSelectAccount: (account: SessionAccount) => void
  onSelectOther: () => void
  otherLabel?: string
  pendingDid: string | null
}) {
  const {currentAccount, accounts} = useSession()
  const t = useTheme()
  const {_} = useLingui()

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
      {accounts.map(account => (
        <React.Fragment key={account.did}>
          <AccountItem
            account={account}
            onSelect={onSelectAccount}
            isCurrentAccount={account.did === currentAccount?.did}
            isPendingAccount={account.did === pendingDid}
          />
          <View style={[{borderBottomWidth: 1}, t.atoms.border_contrast_low]} />
        </React.Fragment>
      ))}
      <Button
        testID="chooseAddAccountBtn"
        style={[a.flex_1]}
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
            <Chevron size="sm" style={[t.atoms.text, a.mr_md]} />
          </View>
        )}
      </Button>
    </View>
  )
}

function AccountItem({
  account,
  onSelect,
  isCurrentAccount,
  isPendingAccount,
}: {
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
  isCurrentAccount: boolean
  isPendingAccount: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {data: profile} = useProfileQuery({did: account.did})

  const onPress = React.useCallback(() => {
    onSelect(account)
  }, [account, onSelect])

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
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            {height: 48},
            (hovered || pressed || isPendingAccount) && t.atoms.bg_contrast_25,
          ]}>
          <View style={a.p_md}>
            <UserAvatar avatar={profile?.avatar} size={24} />
          </View>
          <Text style={[a.align_baseline, a.flex_1, a.flex_row, a.py_sm]}>
            <Text style={[a.font_bold]}>
              {profile?.displayName || account.handle}{' '}
            </Text>
            <Text style={[t.atoms.text_contrast_medium]}>{account.handle}</Text>
          </Text>
          {isCurrentAccount ? (
            <Check
              size="sm"
              style={[{color: t.palette.positive_600}, a.mr_md]}
            />
          ) : (
            <Chevron size="sm" style={[t.atoms.text, a.mr_md]} />
          )}
        </View>
      )}
    </Button>
  )
}
