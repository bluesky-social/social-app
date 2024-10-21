import React from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useModalControls} from '#/state/modals'
import {useSession} from '#/state/session'
import {ExportCarDialog} from '#/view/screens/Settings/ExportCarDialog'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {BirthDateSettingsDialog} from '#/components/dialogs/BirthDateSettings'
import {At_Stroke2_Corner2_Rounded as AtIcon} from '#/components/icons/At'
import {BirthdayCake_Stroke2_Corner2_Rounded as BirthdayCakeIcon} from '#/components/icons/BirthdayCake'
import {Car_Stroke2_Corner2_Rounded as CarIcon} from '#/components/icons/Car'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Freeze_Stroke2_Corner2_Rounded as FreezeIcon} from '#/components/icons/Freeze'
import {Lock_Stroke2_Corner2_Rounded as LockIcon} from '#/components/icons/Lock'
import {PencilLine_Stroke2_Corner2_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {Trash_Stroke2_Corner2_Rounded} from '#/components/icons/Trash'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {ChangeHandleDialog} from './components/ChangeHandleDialog'
import {DeactivateAccountDialog} from './components/DeactivateAccountDialog'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AccountSettings'>
export function AccountSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {openModal} = useModalControls()
  const birthdayControl = useDialogControl()
  const changeHandleControl = useDialogControl()
  const exportCarControl = useDialogControl()
  const deactivateAccountControl = useDialogControl()

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Account`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={EnvelopeIcon} />
            <SettingsList.ItemText>
              <Trans>Email</Trans>
            </SettingsList.ItemText>
            {currentAccount && (
              <>
                <SettingsList.BadgeText>
                  {currentAccount.email || <Trans>(no email)</Trans>}
                </SettingsList.BadgeText>
                {currentAccount.emailConfirmed ? (
                  <CheckIcon color={t.palette.positive_500} size="sm" />
                ) : (
                  <SettingsList.BadgeButton
                    label={_(msg`Verify`)}
                    onPress={() => {}}
                  />
                )}
              </>
            )}
          </SettingsList.Item>
          <SettingsList.PressableItem
            label={_(msg`Change email`)}
            onPress={() => openModal({name: 'change-email'})}>
            <SettingsList.ItemIcon icon={PencilIcon} />
            <SettingsList.ItemText>
              <Trans>Change email</Trans>
            </SettingsList.ItemText>
            <SettingsList.Chevron />
          </SettingsList.PressableItem>
          <SettingsList.LinkItem
            to="/settings/privacy-and-security"
            label={_(msg`Protect your account`)}
            style={[
              a.my_xs,
              a.mx_lg,
              a.rounded_md,
              {backgroundColor: t.palette.primary_50},
            ]}
            chevronColor={t.palette.primary_500}
            hoverStyle={[{backgroundColor: t.palette.primary_100}]}
            contentContainerStyle={[a.rounded_md, a.px_lg]}>
            <SettingsList.ItemIcon
              icon={VerifiedIcon}
              color={t.palette.primary_500}
            />
            <SettingsList.ItemText
              style={[{color: t.palette.primary_500}, a.font_bold]}>
              <Trans>Protect your account</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
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
            accessibilityHint={_(msg`Open change handle dialog`)}
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
