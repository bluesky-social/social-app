import React from 'react'
import {View} from 'react-native'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import flattenReactChildren from 'react-keyed-flatten-children'

import {useAnalytics} from 'lib/analytics/analytics'
import {UserAvatar} from '../../view/com/util/UserAvatar'
import {colors} from 'lib/styles'
import {useSession, useSessionApi, SessionAccount} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {Button} from '#/components/Button'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {ChevronRight_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import * as TextField from '#/components/forms/TextField'
import {FormContainer} from './FormContainer'

function Group({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      {flattenReactChildren(children).map((child, i) => {
        return React.isValidElement(child) ? (
          <React.Fragment key={i}>
            {i > 0 ? (
              <View style={[a.border_b, t.atoms.border_contrast_low]} />
            ) : null}
            {child}
          </React.Fragment>
        ) : null
      })}
    </View>
  )
}

function AccountItem({
  account,
  onSelect,
  isCurrentAccount,
}: {
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
  isCurrentAccount: boolean
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
            (hovered || pressed) && t.atoms.bg_contrast_25,
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
            <Check size="sm" style={[{color: colors.green3}, a.mr_md]} />
          ) : (
            <Chevron size="sm" style={[t.atoms.text, a.mr_md]} />
          )}
        </View>
      )}
    </Button>
  )
}
export const ChooseAccountForm = ({
  onSelectAccount,
  onPressBack,
}: {
  onSelectAccount: (account?: SessionAccount) => void
  onPressBack: () => void
}) => {
  const {track, screen} = useAnalytics()
  const {_} = useLingui()
  const t = useTheme()
  const {accounts, currentAccount} = useSession()
  const {initSession} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  React.useEffect(() => {
    screen('Choose Account')
  }, [screen])

  const onSelect = React.useCallback(
    async (account: SessionAccount) => {
      if (account.accessJwt) {
        if (account.did === currentAccount?.did) {
          setShowLoggedOut(false)
          Toast.show(_(msg`Already signed in as @${account.handle}`))
        } else {
          await initSession(account)
          track('Sign In', {resumedSession: true})
          setTimeout(() => {
            Toast.show(_(msg`Signed in as @${account.handle}`))
          }, 100)
        }
      } else {
        onSelectAccount(account)
      }
    },
    [currentAccount, track, initSession, onSelectAccount, setShowLoggedOut, _],
  )

  return (
    <FormContainer
      testID="chooseAccountForm"
      title={<Trans>Select account</Trans>}>
      <View>
        <TextField.Label>
          <Trans>Sign in as...</Trans>
        </TextField.Label>
        <Group>
          {accounts.map(account => (
            <AccountItem
              key={account.did}
              account={account}
              onSelect={onSelect}
              isCurrentAccount={account.did === currentAccount?.did}
            />
          ))}
          <Button
            testID="chooseNewAccountBtn"
            style={[a.flex_1]}
            onPress={() => onSelectAccount(undefined)}
            label={_(msg`Login to account that is not listed`)}>
            {({hovered, pressed}) => (
              <View
                style={[
                  a.flex_1,
                  a.flex_row,
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
                  <Trans>Other account</Trans>
                </Text>
                <Chevron size="sm" style={[t.atoms.text, a.mr_md]} />
              </View>
            )}
          </Button>
        </Group>
      </View>
      <View style={[a.flex_row]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="small"
          onPress={onPressBack}>
          {_(msg`Back`)}
        </Button>
        <View style={[a.flex_1]} />
      </View>
    </FormContainer>
  )
}
