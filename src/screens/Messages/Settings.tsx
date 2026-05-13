import {useCallback} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {ExportCarDialog} from '#/screens/Settings/components/ExportCarDialog'
import {atoms as a, useTheme} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {Car_Stroke2_Corner2_Rounded as CarIcon} from '#/components/icons/Car'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {useBackgroundNotificationPreferences} from '../../../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

type AllowIncoming = 'all' | 'none' | 'following'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>

export function MessagesSettingsScreen(props: Props) {
  const {t: l} = useLingui()
  const aaCopy = useAgeAssuranceCopy()

  return (
    <AgeRestrictedScreen
      screenTitle={l`Chat settings`}
      infoText={aaCopy.chatsInfoText}>
      <MessagesSettingsScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

export function MessagesSettingsScreenInner({}: Props) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  })
  const {preferences, setPref} = useBackgroundNotificationPreferences()
  const exportCarControl = Dialog.useDialogControl()

  const isGroupChatEnabled = ax.features.enabled(ax.features.GroupChatsEnable)

  const allowMessagesFromOptions: {name: AllowIncoming; label: string}[] = [
    {
      name: 'all',
      label: l({context: 'allow messages from', message: `Everyone`}),
    },
    {
      name: 'following',
      label: l({context: 'allow messages from', message: `Users I follow`}),
    },
    {
      name: 'none',
      label: l({context: 'allow messages from', message: `No one`}),
    },
  ]

  const allowGroupInvitesFromOptions: {name: AllowIncoming; label: string}[] = [
    {
      name: 'all',
      label: l({context: 'allow group chat invites from', message: `Everyone`}),
    },
    {
      name: 'following',
      label: l({
        context: 'allow group chat invites from',
        message: `Users I follow`,
      }),
    },
    {
      name: 'none',
      label: l({context: 'allow group chat invites from', message: `No one`}),
    },
  ]

  const {mutate: updateDeclaration} = useUpdateActorDeclaration({
    onError: () => {
      Toast.show(l`Failed to update settings`, {
        type: 'error',
      })
    },
  })

  const onSelectMessagesFrom = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      if (!key) return
      updateDeclaration({allowIncoming: key as AllowIncoming})
    },
    [updateDeclaration],
  )

  const onSelectGroupInvitesFrom = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      if (!key) return
      updateDeclaration({allowGroupInvites: key as AllowIncoming})
    },
    [updateDeclaration],
  )

  const onSelectSoundSetting = useCallback(
    (selected: boolean) => {
      setPref('playSoundChat', selected)
    },
    [setPref],
  )

  return (
    <Layout.Screen testID="messagesSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Chat Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.py_xl, a.gap_md]}>
          <View style={[a.px_xl]}>
            <Text style={[a.pb_xs, a.text_md, a.font_semi_bold, t.atoms.text]}>
              <Trans>Allow direct messages from</Trans>
            </Text>
            <Text
              style={[
                a.pb_md,
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_high,
              ]}>
              <Trans>
                You can continue ongoing conversations regardless of which
                setting you choose.
              </Trans>
            </Text>
            <Toggle.Group
              label={l`Allow direct messages from`}
              type="radio"
              values={[
                (profile?.associated?.chat?.allowIncoming as AllowIncoming) ??
                  'following',
              ]}
              onChange={onSelectMessagesFrom}>
              <View>
                {allowMessagesFromOptions.map(option => (
                  <Toggle.Item
                    key={option.name}
                    highlightRow
                    name={option.name}
                    label={option.label}>
                    {({selected}) => (
                      <Toggle.RadioWithLabel
                        label={option.label}
                        selected={selected}
                      />
                    )}
                  </Toggle.Item>
                ))}
              </View>
            </Toggle.Group>
          </View>
          <Divider style={{marginVertical: 10}} />
          {isGroupChatEnabled ? (
            <>
              <View style={[a.px_xl]}>
                <Text
                  style={[a.pb_xs, a.text_md, a.font_semi_bold, t.atoms.text]}>
                  <Trans>Allow group chat invites from</Trans>
                </Text>
                <Text
                  style={[
                    a.pb_md,
                    a.text_sm,
                    a.leading_snug,
                    t.atoms.text_contrast_high,
                  ]}>
                  <Trans>
                    You can continue ongoing conversations regardless of which
                    setting you choose.
                  </Trans>
                </Text>
                <Toggle.Group
                  label={l`Allow group chat invites from`}
                  type="radio"
                  values={[
                    (profile?.associated?.chat
                      ?.allowGroupInvites as AllowIncoming) ?? 'following',
                  ]}
                  onChange={onSelectGroupInvitesFrom}>
                  <View>
                    {allowGroupInvitesFromOptions.map(option => (
                      <Toggle.Item
                        key={option.name}
                        highlightRow
                        name={option.name}
                        label={option.label}>
                        {({selected}) => (
                          <Toggle.RadioWithLabel
                            label={option.label}
                            selected={selected}
                          />
                        )}
                      </Toggle.Item>
                    ))}
                  </View>
                </Toggle.Group>
              </View>
              <Divider style={{marginVertical: 10}} />
            </>
          ) : null}
          {IS_NATIVE && (
            <>
              <View style={[a.px_xl]}>
                <Toggle.Item
                  label={l`Notification sounds`}
                  name="playSoundChat"
                  value={preferences.playSoundChat}
                  style={[a.flex_row, a.align_center, a.justify_between]}
                  onChange={onSelectSoundSetting}>
                  <BellIcon style={[a.mr_2xs, t.atoms.text]} size="md" />
                  <Text
                    style={[
                      a.flex_1,
                      a.text_md,
                      a.font_semi_bold,
                      t.atoms.text,
                    ]}>
                    <Trans>Notification sounds</Trans>
                  </Text>
                  <Toggle.Switch />
                </Toggle.Item>
              </View>
              <Divider style={{marginVertical: 10}} />
            </>
          )}
          <View style={[a.px_xl]}>
            <Toggle.Item
              label={l`Export chat data`}
              name="playSoundChat"
              value={preferences.playSoundChat}
              style={[a.flex_row, a.align_center, a.justify_between]}
              onChange={() => {
                exportCarControl.open()
              }}>
              <CarIcon style={[a.mr_2xs, t.atoms.text]} size="md" />
              <Text
                style={[a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text]}>
                <Trans>Export chat data</Trans>
              </Text>
              <ChevronRightIcon style={[a.ml_2xs, t.atoms.text]} size="md" />
            </Toggle.Item>
          </View>
          <Divider style={{marginVertical: 10}} />
        </View>
      </Layout.Content>
      <ExportCarDialog control={exportCarControl} />
    </Layout.Screen>
  )
}
