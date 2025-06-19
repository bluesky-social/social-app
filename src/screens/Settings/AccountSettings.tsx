import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useModalControls} from '#/state/modals'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {BirthDateSettingsDialog} from '#/components/dialogs/BirthDateSettings'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {At_Stroke2_Corner2_Rounded as AtIcon} from '#/components/icons/At'
import {BirthdayCake_Stroke2_Corner2_Rounded as BirthdayCakeIcon} from '#/components/icons/BirthdayCake'
import {Car_Stroke2_Corner2_Rounded as CarIcon} from '#/components/icons/Car'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Freeze_Stroke2_Corner2_Rounded as FreezeIcon} from '#/components/icons/Freeze'
import {Lock_Stroke2_Corner2_Rounded as LockIcon} from '#/components/icons/Lock'
import {PencilLine_Stroke2_Corner2_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Trash_Stroke2_Corner2_Rounded} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {ChangeHandleDialog} from './components/ChangeHandleDialog'
import {DeactivateAccountDialog} from './components/DeactivateAccountDialog'
import {ExportCarDialog} from './components/ExportCarDialog'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccountSettings'>
export function AccountSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {openModal} = useModalControls()
  const emailDialogControl = useEmailDialogControl()
  const birthdayControl = useDialogControl()
  const changeHandleControl = useDialogControl()
  const exportCarControl = useDialogControl()
  const deactivateAccountControl = useDialogControl()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Account</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={EnvelopeIcon} />
            {/* Tricky flexbox situation here: we want the email to truncate, but by default it will make the "Email" text wrap instead.
                For numberOfLines to work, we need flex: 1 on the BadgeText, but that means it goes to width: 50% because the
                ItemText is also flex: 1. So we need to set flex: 0 on the ItemText to prevent it from growing, but if we did that everywhere
                it wouldn't push the BadgeText/Chevron/whatever to the right.
                TODO: find a general solution for this. workaround in this case is to set the ItemText to flex: 1 and BadgeText to flex: 0 -sfn */}
            <SettingsList.ItemText style={[a.flex_0]}>
              <Trans>Email</Trans>
            </SettingsList.ItemText>
            {currentAccount && (
              <>
                <SettingsList.BadgeText style={[a.flex_1]}>
                  {currentAccount.email || <Trans>(no email)</Trans>}
                </SettingsList.BadgeText>
                {currentAccount.emailConfirmed && (
                  <ShieldIcon fill={t.palette.primary_500} size="md" />
                )}
              </>
            )}
          </SettingsList.Item>
          {currentAccount && !currentAccount.emailConfirmed && (
            <SettingsList.PressableItem
              label={_(msg`Verify your email`)}
              onPress={() =>
                emailDialogControl.open({
                  id: EmailDialogScreenID.Verify,
                })
              }
              style={[
                a.my_xs,
                a.mx_lg,
                a.rounded_md,
                {backgroundColor: t.palette.primary_50},
              ]}
              hoverStyle={[{backgroundColor: t.palette.primary_100}]}
              contentContainerStyle={[a.rounded_md, a.px_lg]}>
              <SettingsList.ItemIcon
                icon={ShieldIcon}
                color={t.palette.primary_500}
              />
              <SettingsList.ItemText
                style={[{color: t.palette.primary_500}, a.font_bold]}>
                <Trans>Verify your email</Trans>
              </SettingsList.ItemText>
              <SettingsList.Chevron color={t.palette.primary_500} />
            </SettingsList.PressableItem>
          )}
          <SettingsList.PressableItem
            label={_(msg`Update email`)}
            onPress={() =>
              emailDialogControl.open({
                id: EmailDialogScreenID.Update,
              })
            }>
            <SettingsList.ItemIcon icon={PencilIcon} />
            <SettingsList.ItemText>
              <Trans>Update email</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
          <SettingsList.Divider />
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={BirthdayCakeIcon} />
            <SettingsList.ItemText>
              <Trans>Birthday</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeButton
              label={_(msg`Edit`)}
              onPress={() => birthdayControl.open()}
            />
          </SettingsList.Item>
          <SettingsList.PressableItem
            label={_(msg`Password`)}
            onPress={() => openModal({name: 'change-password'})}>
            <SettingsList.ItemIcon icon={LockIcon} />
            <SettingsList.ItemText>
              <Trans>Password</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
          <SettingsList.PressableItem
            label={_(msg`Handle`)}
            accessibilityHint={_(msg`Opens change handle dialog`)}
            onPress={() => changeHandleControl.open()}>
            <SettingsList.ItemIcon icon={AtIcon} />
            <SettingsList.ItemText>
              <Trans>Handle</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
          <SettingsList.Divider />
          <SettingsList.PressableItem
            label={_(msg`Export my data`)}
            onPress={() => exportCarControl.open()}>
            <SettingsList.ItemIcon icon={CarIcon} />
            <SettingsList.ItemText>
              <Trans>Export my data</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
          <SettingsList.PressableItem
            label={_(msg`Deactivate account`)}
            onPress={() => deactivateAccountControl.open()}
            destructive>
            <SettingsList.ItemIcon icon={FreezeIcon} />
            <SettingsList.ItemText>
              <Trans>Deactivate account</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
          <SettingsList.PressableItem
            label={_(msg`Delete account`)}
            onPress={() => openModal({name: 'delete-account'})}
            destructive>
            <SettingsList.ItemIcon icon={Trash_Stroke2_Corner2_Rounded} />
            <SettingsList.ItemText>
              <Trans>Delete account</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
        </SettingsList.Container>
      </Layout.Content>

      <BirthDateSettingsDialog control={birthdayControl} />
      <ChangeHandleDialog control={changeHandleControl} />
      <ExportCarDialog control={exportCarControl} />
      <DeactivateAccountDialog control={deactivateAccountControl} />
    </Layout.Screen>
  )
}
