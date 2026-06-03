import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AtpAgent, XRPCError} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

async function reactivateWithPassword({
  pdsUrl,
  identifier,
  password,
  authFactorToken,
}: {
  pdsUrl: string
  identifier: string
  password: string
  authFactorToken?: string
}) {
  const agent = new AtpAgent({service: pdsUrl})
  await agent.login({identifier, password, authFactorToken})
  try {
    try {
      await agent.com.atproto.server.activateAccount()
    } catch (e) {
      // On retry after a partial success, the account may already be active.
      // Treat that as a successful no-op so the user isn't stuck.
      if (e instanceof XRPCError && e.error === 'InvalidRequest') return
      throw e
    }
  } finally {
    try {
      await agent.logout()
    } catch {
      // best-effort cleanup; the throwaway session expires anyway
    }
  }
}

const COL_WIDTH = 400

export function Deactivated() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const hasOtherAccounts = accounts.length > 1
  const {logoutCurrentAccount, partialRefreshSession} = useSessionApi()
  const [pending, setPending] = useState(false)
  const [password, setPassword] = useState('')
  const [authFactorToken, setAuthFactorToken] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const onSelectAccount = useCallback(
    (account: SessionAccount) => {
      if (account.did !== currentAccount?.did) {
        onPressSwitchAccount(account, 'SwitchAccount')
      }
    },
    [currentAccount, onPressSwitchAccount],
  )

  const onPressAddAccount = useCallback(() => {
    setShowLoggedOut(true)
  }, [setShowLoggedOut])

  const onPressLogout = useCallback(() => {
    if (IS_WEB) {
      // We're switching accounts, which remounts the entire app.
      // On mobile, this gets us Home, but on the web we also need reset the URL.
      // We can't change the URL via a navigate() call because the navigator
      // itself is about to unmount, and it calls pushState() too late.
      // So we change the URL ourselves. The navigator will pick it up on remount.
      history.pushState(null, '', '/')
    }
    logoutCurrentAccount('Deactivated')
  }, [logoutCurrentAccount])

  const handleActivate = useCallback(async () => {
    if (!password.trim()) return
    if (needs2fa && !authFactorToken.trim()) return
    if (!currentAccount?.pdsUrl || !currentAccount.handle) {
      setError(
        _(msg`Account is missing PDS information. Please sign in again.`),
      )
      return
    }
    setError(undefined)
    setPending(true)
    try {
      await reactivateWithPassword({
        pdsUrl: currentAccount.pdsUrl,
        identifier: currentAccount.handle,
        password,
        authFactorToken: needs2fa ? authFactorToken.trim() : undefined,
      })
      await partialRefreshSession()
      await queryClient.resetQueries()
      setPassword('')
      setAuthFactorToken('')
      setNeeds2fa(false)
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else if (
        e instanceof XRPCError &&
        e.error === 'AuthFactorTokenRequired'
      ) {
        // PDS just emailed a code; reveal the input and let the user retry.
        // Not a real error, so skip the error log below.
        setNeeds2fa(true)
        setError(undefined)
        return
      } else if (
        e instanceof XRPCError &&
        e.message.includes('Token is invalid')
      ) {
        setError(_(msg`Invalid 2FA code. Please try again.`))
      } else if (
        e instanceof XRPCError &&
        (e.status === 401 || e.error === 'AuthenticationRequired')
      ) {
        setError(_(msg`Incorrect password. Please try again.`))
      } else if (e instanceof XRPCError && e.status === 429) {
        setError(
          _(msg`Too many attempts. Please wait a few minutes and try again.`),
        )
      } else {
        setError(_(msg`Couldn't reactivate the account. Please try again.`))
      }

      logger.error(e instanceof Error ? e : String(e), {
        message: 'Failed to activate account',
      })
    } finally {
      setPending(false)
    }
  }, [
    _,
    currentAccount,
    password,
    authFactorToken,
    needs2fa,
    queryClient,
    partialRefreshSession,
  ])

  return (
    <View style={[a.util_screen_outer, a.flex_1]}>
      <Layout.Content
        ignoreTabletLayoutOffset
        contentContainerStyle={[
          a.px_2xl,
          {
            paddingTop: IS_WEB ? 64 : insets.top + 16,
            paddingBottom: IS_WEB ? 64 : insets.bottom,
          },
        ]}>
        <View
          style={[a.w_full, {marginHorizontal: 'auto', maxWidth: COL_WIDTH}]}>
          <View style={[a.w_full, a.justify_center, a.align_center, a.pb_5xl]}>
            <Logo width={40} />
          </View>

          <View style={[a.gap_xs, a.pb_3xl]}>
            <Text style={[a.text_xl, a.font_semi_bold, a.leading_snug]}>
              <Trans>Welcome back!</Trans>
            </Text>
            <Text style={[a.text_sm, a.leading_snug]}>
              <Trans>
                @{currentAccount?.handle} is currently deactivated. If you
                recently moved to a new hosting provider, this is expected —
                reactivation is the last step to complete the migration.
              </Trans>
            </Text>
            <Text style={[a.text_sm, a.leading_snug, a.pb_md]}>
              <Trans>
                Reactivating will restore visibility of your profile and posts
                to other users.
              </Trans>
            </Text>

            <View style={[a.gap_sm]}>
              <View>
                <TextField.LabelText>
                  <Trans>Confirm with your account password</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Icon icon={Lock} />
                  <TextField.Input
                    label={_(msg`Password`)}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    editable={!pending}
                    onSubmitEditing={handleActivate}
                  />
                </TextField.Root>
              </View>
              {needs2fa && (
                <View>
                  <TextField.LabelText>
                    <Trans>2FA confirmation</Trans>
                  </TextField.LabelText>
                  <TextField.Root>
                    <TextField.Icon icon={Ticket} />
                    <TextField.Input
                      label={_(msg`Confirmation code`)}
                      autoFocus
                      value={authFactorToken}
                      onChangeText={setAuthFactorToken}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={{
                        textTransform:
                          authFactorToken === '' ? 'none' : 'uppercase',
                      }}
                      editable={!pending}
                      onSubmitEditing={handleActivate}
                    />
                  </TextField.Root>
                  <Text
                    style={[a.text_sm, a.pt_xs, t.atoms.text_contrast_medium]}>
                    <Trans>
                      Check your email for a sign-in code and enter it here.
                    </Trans>
                  </Text>
                </View>
              )}
              <Button
                label={_(msg`Reactivate your account`)}
                size="large"
                variant="solid"
                color="primary"
                disabled={
                  pending ||
                  !password.trim() ||
                  (needs2fa && !authFactorToken.trim())
                }
                onPress={handleActivate}>
                <ButtonText>
                  {needs2fa ? (
                    <Trans>Confirm and reactivate</Trans>
                  ) : (
                    <Trans>Reactivate my account</Trans>
                  )}
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
                label={_(msg`Sign in or create an account`)}
                size="large"
                variant="solid"
                color="secondary"
                onPress={() => setShowLoggedOut(true)}>
                <ButtonText>
                  <Trans>Sign in or create an account</Trans>
                </ButtonText>
              </Button>
            </>
          )}
        </View>
      </Layout.Content>
    </View>
  )
}
