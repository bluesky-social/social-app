import {useCallback} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {
  type NotificationSettingsPreference,
  useNotificationSettingsQuery,
} from '#/state/queries/notifications/settings'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {ExportCarDialog} from '#/screens/Settings/components/ExportCarDialog'
import {ChatNotificationDialogs} from '#/screens/Settings/NotificationSettings/components/ChatNotificationDialogs'
import {SettingPreview} from '#/screens/Settings/NotificationSettings/components/SettingPreview'
import {atoms as a, useTheme} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {resolveAllowGroupInvites} from '#/components/dms/util'
import * as Toggle from '#/components/forms/Toggle'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {Car_Stroke2_Corner2_Rounded as CarIcon} from '#/components/icons/Car'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import * as Layout from '#/components/Layout'
import * as Skele from '#/components/Skeleton'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
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
  const aa = useAgeAssurance()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  })
  const {data: notificationSettings, isError: notificationSettingsError} =
    useNotificationSettingsQuery()
  const {preferences, setPref} = useBackgroundNotificationPreferences()

  const chatDialogControl = Dialog.useDialogControl()
  const chatRequestDialogControl = Dialog.useDialogControl()
  const exportCarControl = Dialog.useDialogControl()

  const isGroupChatEnabled = !ax.features.enabled(ax.features.GroupChatsDisable)
  const groupInvitesLocked = aa.flags.groupChatDisabled

  const allowMessagesFromOptions: {name: AllowIncoming; label: string}[] = [
    {
      name: 'all',
      label: l({context: 'allow messages from', message: `Everyone`}),
    },
    {
      name: 'following',
      label: l({context: 'allow messages from', message: `People I follow`}),
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
        message: `People I follow`,
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
                  {groupInvitesLocked ? (
                    <Trans>
                      Group chats are only available to users 18 and over.
                    </Trans>
                  ) : (
                    <Trans>
                      You can continue ongoing conversations regardless of which
                      setting you choose.
                    </Trans>
                  )}
                </Text>
                <Toggle.Group
                  disabled={groupInvitesLocked}
                  label={l`Allow group chat invites from`}
                  type="radio"
                  values={[
                    groupInvitesLocked
                      ? 'none'
                      : resolveAllowGroupInvites(profile?.associated?.chat),
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
          <View style={[a.px_xl, a.gap_lg]}>
            <Text style={[a.pb_xs, a.text_md, a.font_semi_bold, t.atoms.text]}>
              <Trans>Notifications</Trans>
            </Text>
            <Toggle.Item
              label={l`Settings for notifications for new messages`}
              name="notificationsChat"
              value={true}
              style={[a.flex_row, a.align_start, a.justify_between]}
              onChange={() => {
                chatDialogControl.open()
              }}>
              <MessageIcon style={[a.mr_2xs, t.atoms.text]} size="lg" />
              <View style={[a.flex_1, a.flex_grow]}>
                <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                  <Trans>New messages</Trans>
                </Text>
                <NotificationPreferenceSubtitle
                  preference={notificationSettings?.chat}
                  isLoading={!notificationSettings}
                  isError={notificationSettingsError}
                />
              </View>
              <ChevronRightIcon style={[a.ml_2xs, t.atoms.text]} size="lg" />
            </Toggle.Item>
            <Toggle.Item
              label={l`Settings for notifications for new message requests`}
              name="notificationsChatRequest"
              value={true}
              style={[a.flex_row, a.align_start, a.justify_between]}
              onChange={() => {
                chatRequestDialogControl.open()
              }}>
              <EnvelopeIcon style={[a.mr_2xs, t.atoms.text]} size="lg" />
              <View style={[a.flex_1, a.flex_grow]}>
                <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                  <Trans>New message requests</Trans>
                </Text>
                <NotificationPreferenceSubtitle
                  preference={notificationSettings?.chatRequest}
                  isLoading={!notificationSettings}
                  isError={notificationSettingsError}
                />
              </View>
              <ChevronRightIcon style={[a.ml_2xs, t.atoms.text]} size="lg" />
            </Toggle.Item>
          </View>
          <Divider style={{marginVertical: 10}} />
          {IS_NATIVE && (
            <>
              <View style={[a.px_xl]}>
                <Toggle.Item
                  label={l`Notification sounds`}
                  name="playSoundChat"
                  value={preferences.playSoundChat}
                  style={[a.flex_row, a.align_center, a.justify_between]}
                  onChange={onSelectSoundSetting}>
                  <BellIcon style={[a.mr_2xs, t.atoms.text]} size="lg" />
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
              label={l`Export my chat data`}
              name="exportChat"
              value={true}
              style={[a.flex_row, a.align_center, a.justify_between]}
              onChange={() => {
                exportCarControl.open()
              }}>
              <CarIcon style={[a.mr_2xs, t.atoms.text]} size="lg" />
              <Text
                style={[a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text]}>
                <Trans>Export my chat data</Trans>
              </Text>
              <ChevronRightIcon style={[a.ml_2xs, t.atoms.text]} size="lg" />
            </Toggle.Item>
          </View>
          <Divider style={{marginVertical: 10}} />
        </View>
      </Layout.Content>
      <ChatNotificationDialogs
        chatControl={chatDialogControl}
        chatRequestControl={chatRequestDialogControl}
      />
      <ExportCarDialog control={exportCarControl} />
    </Layout.Screen>
  )
}

function NotificationPreferenceSubtitle({
  preference,
  isLoading,
  isError,
}: {
  preference?: NotificationSettingsPreference
  isLoading: boolean
  isError: boolean
}) {
  const t = useTheme()

  if (isError) {
    return (
      <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
        <Trans>Failed to load notification settings.</Trans>
      </Text>
    )
  }

  if (isLoading) {
    return <Skele.Text style={[a.text_sm, {width: 120}]} />
  }

  return (
    <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
      <SettingPreview preference={preference} />
    </Text>
  )
}
