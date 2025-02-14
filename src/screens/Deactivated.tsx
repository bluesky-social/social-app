import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {
  type SessionAccount,
  useAgent,
  useSession,
  useSessionApi,
} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const COL_WIDTH = 400

export function Deactivated() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const hasOtherAccounts = accounts.length > 1
  const setMinimalShellMode = useSetMinimalShellMode()
  const {logoutCurrentAccount} = useSessionApi()
  const agent = useAgent()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()
  const queryClient = useQueryClient()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(true)
    }, [setMinimalShellMode]),
  )

  const onSelectAccount = React.useCallback(
    (account: SessionAccount) => {
      if (account.did !== currentAccount?.did) {
        onPressSwitchAccount(account, 'SwitchAccount')
      }
    },
    [currentAccount, onPressSwitchAccount],
  )

  const onPressAddAccount = React.useCallback(() => {
    setShowLoggedOut(true)
  }, [setShowLoggedOut])

  const onPressLogout = React.useCallback(() => {
    if (isWeb) {
      // We're switching accounts, which remounts the entire app.
      // On mobile, this gets us Home, but on the web we also need reset the URL.
      // We can't change the URL via a navigate() call because the navigator
      // itself is about to unmount, and it calls pushState() too late.
      // So we change the URL ourselves. The navigator will pick it up on remount.
      history.pushState(null, '', '/')
    }
    logoutCurrentAccount('Deactivated')
  }, [logoutCurrentAccount])

  const handleActivate = React.useCallback(async () => {
    try {
      setPending(true)
      await agent.com.atproto.server.activateAccount()
      await queryClient.resetQueries()
      await agent.resumeSession(agent.session!)
    } catch (e: any) {
      switch (e.message) {
        case 'Bad token scope':
          setError(
            _(
              msg`You're signed in with an App Password. Please sign in with your main password to continue deactivating your account.`,
            ),
          )
          break
        default:
          setError(_(msg`Something went wrong, please try again`))
          break
      }

      logger.error(e, {
        context: 'Failed to activate account',
      })
    } finally {
      setPending(false)
    }
  }, [_, agent, setPending, setError, queryClient])

  return (
    <View style={[a.util_screen_outer, a.flex_1]}>
      <Layout.Content
        contentContainerStyle={[
          a.px_2xl,
          {
            paddingTop: isWeb ? 64 : insets.top + 16,
            paddingBottom: isWeb ? 64 : insets.bottom,
          },
        ]}>
        <View
          style={[a.w_full, {marginHorizontal: 'auto', maxWidth: COL_WIDTH}]}>
          <View style={[a.w_full, a.justify_center, a.align_center, a.pb_5xl]}>
            <Logo width={40} />
          </View>

          <View style={[a.gap_xs, a.pb_3xl]}>
            <Text style={[a.text_xl, a.font_bold, a.leading_snug]}>
              <Trans>Welcome back!</Trans>
            </Text>
            <Text style={[a.text_sm, a.leading_snug]}>
              <Trans>
                You previously deactivated @{currentAccount?.handle}.
              </Trans>
            </Text>
            <Text style={[a.text_sm, a.leading_snug, a.pb_md]}>
              <Trans>
                You can reactivate your account to continue logging in. Your
                profile and posts will be visible to other users.
              </Trans>
            </Text>

            <View style={[a.gap_sm]}>
              <Button
                label={_(msg`Reactivate your account`)}
                size="large"
                variant="solid"
                color="primary"
                onPress={handleActivate}>
                <ButtonText>
                  <Trans>Yes, reactivate my account</Trans>
                </ButtonText>
                {pending && <ButtonIcon icon={Loader} position="right" />}
              </Button>
              <Button
                label={_(msg`Cancel reactivation and sign out`)}
                size="large"
                variant="solid"
                color="secondary"
                onPress={onPressLogout}>
                <ButtonText>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
            </View>

            {error && (
              <View
                style={[
                  a.flex_row,
                  a.gap_sm,
                  a.mt_md,
                  a.p_md,
                  a.rounded_sm,
                  t.atoms.bg_contrast_25,
                ]}>
                <CircleInfo size="md" fill={t.palette.negative_400} />
                <Text style={[a.flex_1, a.leading_snug]}>{error}</Text>
              </View>
            )}
          </View>

          <View style={[a.pb_3xl]}>
            <Divider />
          </View>

          {hasOtherAccounts ? (
            <>
              <Text
                style={[t.atoms.text_contrast_medium, a.pb_md, a.leading_snug]}>
                <Trans>Or, sign in to one of your other accounts.</Trans>
              </Text>
              <AccountList
                onSelectAccount={onSelectAccount}
                onSelectOther={onPressAddAccount}
                otherLabel={_(msg`Add account`)}
                pendingDid={pendingDid}
              />
            </>
          ) : (
            <>
              <Text
                style={[t.atoms.text_contrast_medium, a.pb_md, a.leading_snug]}>
                <Trans>Or, continue with another account.</Trans>
              </Text>
              <Button
                label={_(msg`Sign in or sign up`)}
                size="large"
                variant="solid"
                color="secondary"
                onPress={() => setShowLoggedOut(true)}>
                <ButtonText>
                  <Trans>Sign in or sign up</Trans>
                </ButtonText>
              </Button>
            </>
          )}
        </View>
      </Layout.Content>
    </View>
  )
}
