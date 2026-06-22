import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  isChatPreferenceName,
  type NotificationSettingsPreferenceName,
  useChatNotificationSettingsQuery,
  useNotificationSettingsQuery,
} from '#/state/queries/notifications/settings'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {PreferenceControls} from '#/screens/Settings/NotificationSettings/components/PreferenceControls'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

type NotificationSettingsDialogProps = {
  control: Dialog.DialogControlProps
  name: NotificationSettingsPreferenceName
  syncOthers?: NotificationSettingsPreferenceName[]
  icon: React.ComponentType<SVGIconProps>
  titleText: React.ReactNode
  subtitleText: React.ReactNode
  allowDisableInApp?: boolean
}

export function NotificationSettingsDialog({
  control,
  name,
  syncOthers,
  titleText,
  subtitleText,
  allowDisableInApp = true,
}: NotificationSettingsDialogProps) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <NotificationSettingsDialogInner
        control={control}
        name={name}
        syncOthers={syncOthers}
        titleText={titleText}
        subtitleText={subtitleText}
        allowDisableInApp={allowDisableInApp}
      />
    </Dialog.Outer>
  )
}

function NotificationSettingsDialogInner({
  control,
  name,
  syncOthers,
  titleText,
  subtitleText,
  allowDisableInApp,
}: Omit<NotificationSettingsDialogProps, 'icon'>) {
  const t = useTheme()
  const {t: l} = useLingui()
  const isChat = isChatPreferenceName(name)
  const appQuery = useNotificationSettingsQuery({enabled: !isChat})
  const chatQuery = useChatNotificationSettingsQuery({enabled: isChat})
  const isError = isChat ? chatQuery.isError : appQuery.isError
  const preference = isChatPreferenceName(name)
    ? chatQuery.data?.[name]
    : appQuery.data?.[name]

  return (
    <>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Notification settings`}
        style={web({maxWidth: 400})}>
        <SettingsList.Container>
          <View style={[a.flex_1, a.gap_xs, a.mb_md]}>
            <Text style={[a.font_semi_bold, a.text_lg]}>{titleText}</Text>
            <Text
              style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
              {subtitleText}
            </Text>
          </View>
          {isError ? (
            <View style={[a.mt_md]}>
              <Admonition type="error">
                <Trans>Failed to load notification settings.</Trans>
              </Admonition>
            </View>
          ) : (
            <PreferenceControls
              name={name}
              syncOthers={syncOthers}
              preference={preference}
              allowDisableInApp={allowDisableInApp}
            />
          )}
        </SettingsList.Container>
        <Dialog.Close />
        {IS_NATIVE && (
          <Button
            color="primary"
            size="large"
            label={l`Close dialog`}
            onPress={() => control.close()}
            style={[a.mt_md]}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        )}
      </Dialog.ScrollableInner>
    </>
  )
}
