import React, {useCallback} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useActorStatus} from '#/lib/actor-status'
import {isJwtExpired} from '#/lib/jwt'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfilesQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'

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
        a.rounded_lg,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
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
          <View style={[a.border_b, t.atoms.border_contrast_low]} />
        </React.Fragment>
      ))}
      <Button
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
              a.p_lg,
              a.gap_sm,
              (hovered || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_full,
                {width: 48, height: 48},
                a.justify_center,
                a.align_center,
                (hovered || pressed) && t.atoms.bg_contrast_50,
              ]}>
              <PlusIcon style={[t.atoms.text_contrast_low]} size="md" />
            </View>
            <Text style={[a.flex_1, a.leading_tight, a.text_md, a.font_medium]}>
              {otherLabel ?? <Trans>Other account</Trans>}
            </Text>
            <ChevronIcon size="md" style={[t.atoms.text_contrast_low]} />
          </View>
        )}
      </Button>
    </View>
  )
}

function AccountItem({
  profile,
  account,
  onSelect,
  isCurrentAccount,
  isPendingAccount,
}: {
  profile?: AppBskyActorDefs.ProfileViewDetailed
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
  isCurrentAccount: boolean
  isPendingAccount: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const verification = useSimpleVerificationState({profile})
  const {isActive: live} = useActorStatus(profile)

  const onPress = useCallback(() => {
    onSelect(account)
  }, [account, onSelect])

  const isLoggedOut = !account.refreshJwt || isJwtExpired(account.refreshJwt)

  return (
    <Button
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
            a.p_lg,
            a.gap_sm,
            (hovered || pressed || isPendingAccount) && t.atoms.bg_contrast_25,
          ]}>
          <UserAvatar
            avatar={profile?.avatar}
            size={48}
            type={profile?.associated?.labeler ? 'labeler' : 'user'}
            live={live}
            hideLiveBadge
          />

          <View style={[a.flex_1, a.gap_2xs, a.pr_2xl]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Text
                emoji
                style={[a.font_medium, a.leading_tight, a.text_md]}
                numberOfLines={1}>
                {sanitizeDisplayName(
                  profile?.displayName || profile?.handle || account.handle,
                )}
              </Text>
              {verification.showBadge && (
                <View>
                  <VerificationCheck
                    width={12}
                    verifier={verification.role === 'verifier'}
                  />
                </View>
              )}
            </View>
            <Text
              style={[
                a.leading_tight,
                t.atoms.text_contrast_medium,
                a.text_sm,
              ]}>
              {sanitizeHandle(account.handle, '@')}
            </Text>
            {isLoggedOut && (
              <Text
                style={[
                  a.leading_tight,
                  a.text_xs,
                  a.italic,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>Logged out</Trans>
              </Text>
            )}
          </View>

          {isCurrentAccount ? (
            <View
              style={[
                {
                  width: 20,
                  height: 20,
                  backgroundColor: t.palette.positive_500,
                },
                a.rounded_full,
                a.justify_center,
                a.align_center,
              ]}>
              <CheckIcon size="xs" style={[{color: t.palette.white}]} />
            </View>
          ) : (
            <ChevronIcon size="md" style={[t.atoms.text_contrast_low]} />
          )}
        </View>
      )}
    </Button>
  )
}
