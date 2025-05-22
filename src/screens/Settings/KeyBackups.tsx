import {useCallback, useEffect, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  StretchOutY,
} from 'react-native-reanimated'
import * as SecureStore from 'expo-secure-store'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {isNative, isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {EmptyState} from '#/view/com/util/EmptyState'
import * as Toast from '#/view/com/util/Toast'
import {type RotationKey} from '#/screens/Settings/components/types'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ChangeEmailDialog} from '#/components/dialogs/ChangeEmailDialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {KeyBackupDialog} from './components/KeyBackupDialog'
import * as SettingsList from './components/SettingsList'
type Props = NativeStackScreenProps<CommonNavigatorParams, 'KeyBackups'>
import * as Clipboard from 'expo-clipboard'

export function KeyBackupsScreen({}: Props) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const backupKeyDialogControl = useDialogControl()
  const verifyEmailDialogControl = useDialogControl()
  const changeEmailDialogControl = useDialogControl()

  const [keyBackups, setKeyBackups] = useState<RotationKey[]>([])

  const onBackupKey = useCallback(() => {
    if (!currentAccount) {
      return
    }

    // Check if email is verified before allowing key backup
    if (!currentAccount.emailConfirmed) {
      verifyEmailDialogControl.open()
      return
    }

    // Open the backup key dialog
    backupKeyDialogControl.open()
  }, [currentAccount, backupKeyDialogControl, verifyEmailDialogControl])

  const fetchRotationKeys = async () => {
    if (!isNative || !(await SecureStore.isAvailableAsync())) {
      return
    }
    const rotationKeys = await SecureStore.getItemAsync('rotationKeys')
    setKeyBackups(rotationKeys ? JSON.parse(rotationKeys) : [])
  }

  useEffect(() => {
    fetchRotationKeys()
  }, [])

  return (
    <Layout.Screen testID="KeyBackupsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Key Backups</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <View style={[a.flex_1, a.gap_md]}>
                <Text style={[a.text_sm]}>
                  <Trans>
                    These keys can be used to recover your account if you lose
                    your password.
                  </Trans>
                </Text>
                <Text style={[a.text_sm]}>
                  <Trans>
                    Anyone with possession of this key can take PERMANENT and
                    IRREVOCABLE control over your account.
                  </Trans>
                </Text>
                <Text style={[a.text_sm]}>
                  <Trans>DO NOT SHARE THESE KEYS WITH ANYONE.</Trans>
                </Text>
              </View>
            </Admonition>
          </SettingsList.Item>
          {currentAccount && (
            <SettingsList.Item>
              <Button
                label={_(msg`Add Key Backup`)}
                size="large"
                color="primary"
                variant="solid"
                onPress={onBackupKey}
                style={[a.flex_1]}>
                <ButtonIcon icon={PlusIcon} />
                <ButtonText>
                  <Trans>Add Key Backup</Trans>
                </ButtonText>
              </Button>
            </SettingsList.Item>
          )}
          {isNative && (
            <>
              <SettingsList.Divider />
              <LayoutAnimationConfig skipEntering skipExiting>
                {keyBackups ? (
                  keyBackups.length > 0 ? (
                    <View style={[a.overflow_hidden]}>
                      {keyBackups.map(keyBackup => (
                        <Animated.View
                          key={keyBackup.did}
                          style={a.w_full}
                          entering={FadeIn}
                          exiting={isWeb ? FadeOut : StretchOutY}
                          layout={LinearTransition.delay(150)}>
                          <SettingsList.Item>
                            <KeyBackupCard
                              keyBackup={keyBackup}
                              refreshKeyBackups={fetchRotationKeys}
                            />
                          </SettingsList.Item>
                        </Animated.View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="growth"
                      message={_(msg`No keys found on this device`)}
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
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>

      <KeyBackupDialog
        control={backupKeyDialogControl}
        refreshKeyBackups={fetchRotationKeys}
      />
      <VerifyEmailDialog
        control={verifyEmailDialogControl}
        changeEmailControl={changeEmailDialogControl}
        onCloseAfterVerifying={backupKeyDialogControl.open}
        reasonText={_(
          msg`You need to verify your email address before you can create a backup key.`,
        )}
      />
      <ChangeEmailDialog
        control={changeEmailDialogControl}
        verifyEmailControl={verifyEmailDialogControl}
      />
    </Layout.Screen>
  )
}

const deleteKeyBackup = async (keyBackup: RotationKey) => {
  if (!isNative || !(await SecureStore.isAvailableAsync())) {
    return
  }
  const rotationKeys = await SecureStore.getItemAsync('rotationKeys')
  if (!rotationKeys) {
    throw new Error('No rotation keys found!')
  }
  const rotationKeysArray = JSON.parse(rotationKeys)
  const index = rotationKeysArray.findIndex(
    (k: RotationKey) => k.did === keyBackup.did,
  )
  rotationKeysArray.splice(index, 1)
  await SecureStore.setItemAsync(
    'rotationKeys',
    JSON.stringify(rotationKeysArray),
  )
}

function KeyBackupCard({
  keyBackup,
  refreshKeyBackups,
}: {
  keyBackup: RotationKey
  refreshKeyBackups: () => void
}) {
  const t = useTheme()
  const {i18n, _} = useLingui()
  const deleteControl = Prompt.usePromptControl()

  const onDelete = useCallback(async () => {
    await deleteKeyBackup(keyBackup)
    refreshKeyBackups()
    Toast.show(_(msg({message: 'Key backup deleted', context: 'toast'})))
  }, [_, refreshKeyBackups, keyBackup])

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
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          let clipboardContent = `${keyBackup.did}\n${keyBackup.privateKey}`
          Clipboard.setStringAsync(clipboardContent)
          Toast.show(
            _(
              msg({
                message: 'Key backup copied to clipboard',
                context: 'toast',
              }),
            ),
          )
        }}>
        <View
          style={[
            a.flex_row,
            a.justify_between,
            a.align_start,
            a.w_full,
            a.gap_sm,
          ]}>
          <View style={[a.gap_xs, a.flex_1]}>
            <Text style={[t.atoms.text, a.text_md, a.font_bold, a.flex_wrap]}>
              {keyBackup.did}
            </Text>
            <Text style={[t.atoms.text_contrast_medium]}>
              <Trans>
                Created{' '}
                {i18n.date(new Date(keyBackup.createdAt), {
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
            label={_(msg`Delete key backup`)}
            variant="ghost"
            color="negative"
            size="small"
            style={[a.bg_transparent]}
            onPress={() => deleteControl.open()}>
            <ButtonIcon icon={TrashIcon} />
          </Button>
        </View>
      </TouchableOpacity>

      <Prompt.Basic
        control={deleteControl}
        title={_(msg`Delete key backup?`)}
        description={_(msg`Are you sure you want to delete this key backup?`)}
        onConfirm={onDelete}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
      />
    </View>
  )
}
