import {useCallback} from 'react'
import {View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {type ComAtprotoServerListAppPasswords} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {
  useAppPasswordDeleteMutation,
  useAppPasswordsQuery,
} from '#/state/queries/app-passwords'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Admonition, colors} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {AddAppPasswordDialog} from './components/AddAppPasswordDialog'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppPasswords'>
export function AppPasswordsScreen({}: Props) {
  const {_} = useLingui()
  const {data: appPasswords, error} = useAppPasswordsQuery()
  const createAppPasswordControl = useDialogControl()

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
                  Use app passwords to sign in to other Bluesky clients without
                  giving full access to your account or password.
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
                          <AppPasswordCard appPassword={appPassword} />
                        </SettingsList.Item>
                      </Animated.View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon="growth"
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
      />
    </Layout.Screen>
  )
}

function AppPasswordCard({
  appPassword,
}: {
  appPassword: ComAtprotoServerListAppPasswords.AppPassword
}) {
  const t = useTheme()
  const {i18n, _} = useLingui()
  const deleteControl = Prompt.usePromptControl()
  const {mutateAsync: deleteMutation} = useAppPasswordDeleteMutation()

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
          <WarningIcon style={[{color: colors.warning}]} />
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
        onConfirm={onDelete}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
      />
    </View>
  )
}
