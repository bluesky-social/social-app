import {useCallback, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {type ComAtprotoServerListAppPasswords} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useBrand} from '#/lib/community/BrandContext'
import {useIsBlackskyPds} from '#/lib/hooks/useIsBlackskyPds'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {
  type GatekeeperConfig,
  useAppPasswordDeleteMutation,
  useAppPasswordsQuery,
} from '#/state/queries/app-passwords'
import {useSession} from '#/state/session'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'
import {Lock_Stroke2_Corner2_Rounded as Lock} from '#/components/icons/Lock'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {AddAppPasswordDialog} from './components/AddAppPasswordDialog'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppPasswords'>
export function AppPasswordsScreen({}: Props) {
  const {_} = useLingui()
  const brand = useBrand()
  const {currentAccount} = useSession()
  const isOauth = currentAccount?.isOauthSession === true
  const isBskyPds = useIsBlackskyPds()
  const useGatekeeper = isOauth && isBskyPds

  const [gatekeeperPassword, setGatekeeperPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState<string | undefined>()

  const gatekeeper: GatekeeperConfig | undefined =
    useGatekeeper && isAuthenticated && currentAccount
      ? {
          serviceUrl: currentAccount.service,
          did: currentAccount.did,
          password: gatekeeperPassword,
        }
      : undefined

  const {data: appPasswords, error} = useAppPasswordsQuery(
    useGatekeeper ? gatekeeper : undefined,
  )

  const createAppPasswordControl = useDialogControl()

  const handleAuthenticate = useCallback(() => {
    if (!gatekeeperPassword) {
      setAuthError(_(msg`Please enter your password.`))
      return
    }
    setAuthError(undefined)
    setIsAuthenticated(true)
  }, [gatekeeperPassword, _])

  if (useGatekeeper && !isAuthenticated) {
    return (
      <Layout.Screen testID="AppPasswordsScreen">
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>App Passwords</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content>
          <SettingsList.Container>
            <SettingsList.Item>
              <View style={[a.flex_1, a.gap_lg]}>
                <Text style={[a.text_md, a.leading_snug]}>
                  <Trans>
                    Please enter your account password to manage app passwords.
                  </Trans>
                </Text>
                <TextField.Root>
                  <TextField.Icon icon={Lock} />
                  <TextField.Input
                    label={_(msg`Password`)}
                    placeholder={_(msg`Password`)}
                    defaultValue={gatekeeperPassword}
                    onChangeText={setGatekeeperPassword}
                    onSubmitEditing={handleAuthenticate}
                    secureTextEntry
                    autoComplete="password"
                    autoCapitalize="none"
                    autoFocus
                  />
                </TextField.Root>
                {authError && <Admonition type="error">{authError}</Admonition>}
                <Button
                  label={_(msg`Continue`)}
                  size="large"
                  variant="solid"
                  color="primary"
                  onPress={handleAuthenticate}
                  disabled={!gatekeeperPassword}>
                  <ButtonText>
                    <Trans>Continue</Trans>
                  </ButtonText>
                </Button>
              </View>
            </SettingsList.Item>
          </SettingsList.Container>
        </Layout.Content>
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen testID="AppPasswordsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>App Passwords</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        {error ? (
          <ErrorScreen
            title={_(msg`Oops!`)}
            message={_(msg`There was an issue fetching your app passwords`)}
            details={cleanError(error)}
          />
        ) : (
          <SettingsList.Container>
            <SettingsList.Item>
              <Admonition type="tip" style={[a.flex_1]}>
                <Trans>
                  Use app passwords to sign in to other{' '}
                  {brand.metadata.displayName} clients without giving full
                  access to your account or password.
                </Trans>
              </Admonition>
            </SettingsList.Item>
            <SettingsList.Item>
              <Button
                label={_(msg`Add App Password`)}
                size="large"
                color="primary"
                variant="solid"
                onPress={() => createAppPasswordControl.open()}
                style={[a.flex_1]}>
                <ButtonIcon icon={PlusIcon} />
                <ButtonText>
                  <Trans>Add App Password</Trans>
                </ButtonText>
              </Button>
            </SettingsList.Item>
            <SettingsList.Divider />
            <LayoutAnimationConfig skipEntering skipExiting>
              {appPasswords ? (
                appPasswords.length > 0 ? (
                  <View style={[a.overflow_hidden]}>
                    {appPasswords.map(appPassword => (
                      <Animated.View
                        key={appPassword.name}
                        style={a.w_full}
                        entering={FadeIn}
                        exiting={FadeOut}
                        layout={LinearTransition.delay(150)}>
                        <SettingsList.Item>
                          <AppPasswordCard
                            appPassword={appPassword}
                            gatekeeper={gatekeeper}
                          />
                        </SettingsList.Item>
                      </Animated.View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon={Growth}
                    message={_(msg`No app passwords yet`)}
                  />
                )
              ) : (
                <View
                  style={[
                    a.flex_1,
                    a.justify_center,
                    a.align_center,
                    a.py_4xl,
                  ]}>
                  <Loader size="xl" />
                </View>
              )}
            </LayoutAnimationConfig>
          </SettingsList.Container>
        )}
      </Layout.Content>

      <AddAppPasswordDialog
        control={createAppPasswordControl}
        passwords={appPasswords?.map(p => p.name) || []}
        gatekeeper={gatekeeper}
      />
    </Layout.Screen>
  )
}

function AppPasswordCard({
  appPassword,
  gatekeeper,
}: {
  appPassword: ComAtprotoServerListAppPasswords.AppPassword
  gatekeeper?: GatekeeperConfig
}) {
  const t = useTheme()
  const {i18n, _} = useLingui()
  const deleteControl = Prompt.usePromptControl()
  const {mutateAsync: deleteMutation} = useAppPasswordDeleteMutation(gatekeeper)

  const onDelete = useCallback(async () => {
    await deleteMutation({name: appPassword.name})
    Toast.show(_(msg({message: 'App password deleted', context: 'toast'})))
  }, [deleteMutation, appPassword.name, _])

  return (
    <View
      style={[
        a.w_full,
        a.border,
        a.rounded_sm,
        a.px_md,
        a.py_sm,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
      ]}>
      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.align_start,
          a.w_full,
          a.gap_sm,
        ]}>
        <View style={[a.gap_xs]}>
          <Text style={[t.atoms.text, a.text_md, a.font_semi_bold]}>
            {appPassword.name}
          </Text>
          <Text style={[t.atoms.text_contrast_medium]}>
            <Trans>
              Created{' '}
              {i18n.date(appPassword.createdAt, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Trans>
          </Text>
        </View>
        <Button
          label={_(msg`Delete app password`)}
          variant="ghost"
          color="negative"
          size="small"
          shape="square"
          style={[a.bg_transparent]}
          onPress={() => deleteControl.open()}>
          <ButtonIcon icon={TrashIcon} />
        </Button>
      </View>
      {appPassword.privileged && (
        <View style={[a.flex_row, a.gap_sm, a.align_center, a.mt_md]}>
          <WarningIcon style={[{color: t.palette.yellow}]} />
          <Text style={t.atoms.text_contrast_high}>
            <Trans>Allows access to direct messages</Trans>
          </Text>
        </View>
      )}

      <Prompt.Basic
        control={deleteControl}
        title={_(msg`Delete app password?`)}
        description={_(
          msg`Are you sure you want to delete the app password "${appPassword.name}"?`,
        )}
        onConfirm={() => void onDelete()}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
      />
    </View>
  )
}
