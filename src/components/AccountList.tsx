import React, {useCallback} from 'react'
import {View} from 'react-native'
import {type AppGndrActorDefs} from '@gander-social-atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useActorStatus} from '#/lib/actor-status'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
// import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfilesQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {ChevronRight_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
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
  const {data: profiles} = useProfilesQuery({
    handles: accounts.map(acc => acc.did),
  })

  const onPressAddAccount = useCallback(() => {
    onSelectOther()
  }, [onSelectOther])

  return (
    <View
      pointerEvents={pendingDid ? 'none' : 'auto'}
      style={[
        a.overflow_hidden,
        t.atoms.border_contrast_low,
        a.mt_md,

        {borderRadius: 8},
      ]}>
      {accounts.map(account => (
        <React.Fragment key={account.did}>
          <AccountItem
            profile={profiles?.profiles.find(p => p.did === account.did)}
            account={account}
            onSelect={onSelectAccount}
            isCurrentAccount={account.did === currentAccount?.did}
            isPendingAccount={account.did === pendingDid}
          />
          <View style={[{borderBottomWidth: 1, borderColor: '#D8D8D8'}]} />
        </React.Fragment>
      ))}
      <Button
        hitSlop={24}
        testID="chooseAddAccountBtn"
        style={[a.flex_1]}
        onPress={pendingDid ? undefined : onPressAddAccount}
        label={_(msg`Sign in to account that is not listed`)}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.py_lg,
              a.px_sm,
              {borderBottomStartRadius: 8, borderBottomEndRadius: 8},
              (hovered || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <Text
              style={[
                a.flex_1,
                a.flex_row,
                a.font_bold,
                a.leading_tight,
                a.text_md,
                a.py_md,
              ]}>
              {otherLabel ?? <Trans>Other Account</Trans>}
            </Text>
            <Chevron size="sm" style={[t.atoms.text]} />
          </View>
        )}
      </Button>
    </View>
  )
}

export function AccountItem({
  profile,
  account,
  onSelect,
  isCurrentAccount,
  isPendingAccount,
  hideEndIcon = false,
}: {
  profile?: AppGndrActorDefs.ProfileViewDetailed
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
  isCurrentAccount: boolean
  isPendingAccount: boolean
  hideEndIcon?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const verification = useSimpleVerificationState({profile})
  const {isActive: live} = useActorStatus(profile)

  const onPress = useCallback(() => {
    onSelect(account)
  }, [account, onSelect])

  return (
    <Button
      hitSlop={24}
      testID={`chooseAccountBtn-${account.handle}`}
      key={account.did}
      style={[a.w_full]}
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
            a.gap_sm,
            a.py_lg,
            a.px_sm,
            (hovered || pressed || isPendingAccount) && t.atoms.bg_contrast_25,
          ]}>
          <UserAvatar
            avatar={profile?.avatar}
            size={45}
            type={profile?.associated?.labeler ? 'labeler' : 'user'}
            live={live}
            hideLiveBadge
          />

          <View style={[a.flex_1, a.pr_2xl, a.gap_2xs]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Text
                emoji
                style={[a.font_bold, a.leading_tight, a.text_md]}
                numberOfLines={1}>
                {sanitizeDisplayName(
                  profile?.displayName || profile?.handle || account.handle,
                )}
              </Text>
              {verification.showBadge && (
                <View>
                  <VerificationCheck
                    width={15}
                    verifier={verification.role === 'verifier'}
                  />
                </View>
              )}
            </View>
            <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>
              {sanitizeHandle(account.handle, '@')}
            </Text>
          </View>

          {hideEndIcon ? null : isCurrentAccount ? (
            <Check size="sm" style={[{color: t.palette.positive_600}]} />
          ) : (
            <Chevron size="sm" style={[t.atoms.text]} />
          )}
        </View>
      )}
    </Button>
  )
}
