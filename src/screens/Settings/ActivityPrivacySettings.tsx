import {View} from 'react-native'
import {type AppBskyNotificationDeclaration} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  useNotificationDeclarationMutation,
  useNotificationDeclarationQuery,
} from '#/state/queries/activity-subscriptions'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as SettingsList from './components/SettingsList'
import {ItemTextWithSubtitle} from './NotificationSettings/components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'ActivityPrivacySettings'
>
export function ActivityPrivacySettingsScreen({}: Props) {
  const {
    data: notificationDeclaration,
    isPending,
    isError,
  } = useNotificationDeclarationQuery()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Privacy and Security</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item style={[a.align_start]}>
            <SettingsList.ItemIcon icon={BellRingingIcon} />
            <ItemTextWithSubtitle
              bold
              titleText={
                <Trans>Allow others to be notified of your posts</Trans>
              }
              subtitleText={
                <Trans>
                  This feature allows users to receive notifications for your
                  new posts and replies. Who do you want to enable this for?
                </Trans>
              }
            />
          </SettingsList.Item>
          <View style={[a.px_xl, a.pt_md]}>
            {isError ? (
              <Admonition type="error">
                <Trans>Failed to load preference.</Trans>
              </Admonition>
            ) : isPending ? (
              <View style={[a.w_full, a.pt_5xl, a.align_center]}>
                <Loader size="xl" />
              </View>
            ) : (
              <Inner notificationDeclaration={notificationDeclaration} />
            )}
          </View>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

export function Inner({
  notificationDeclaration,
}: {
  notificationDeclaration: {
    uri?: string
    cid?: string
    value: AppBskyNotificationDeclaration.Record
  }
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mutate} = useNotificationDeclarationMutation()

  const onChangeFilter = ([declaration]: string[]) => {
    mutate({
      $type: 'app.bsky.notification.declaration',
      allowSubscriptions: declaration,
    })
  }

  return (
    <Toggle.Group
      type="radio"
      label={_(
        msg`Filter who can opt to receive notifications for your activity`,
      )}
      values={[notificationDeclaration.value.allowSubscriptions]}
      onChange={onChangeFilter}>
      <View style={[a.gap_sm]}>
        <Toggle.Item
          label={_(msg`Anyone who follows me`)}
          name="followers"
          style={[a.flex_row, a.py_xs, a.gap_sm]}>
          <Toggle.Radio />
          <Toggle.LabelText style={[t.atoms.text, a.font_normal, a.text_md]}>
            <Trans>Anyone who follows me</Trans>
          </Toggle.LabelText>
        </Toggle.Item>
        <Toggle.Item
          label={_(msg`Only followers who I follow`)}
          name="mutuals"
          style={[a.flex_row, a.py_xs, a.gap_sm]}>
          <Toggle.Radio />
          <Toggle.LabelText style={[t.atoms.text, a.font_normal, a.text_md]}>
            <Trans>Only followers who I follow</Trans>
          </Toggle.LabelText>
        </Toggle.Item>
        <Toggle.Item
          label={_(msg({context: 'enable for', message: `No one`}))}
          name="none"
          style={[a.flex_row, a.py_xs, a.gap_sm]}>
          <Toggle.Radio />
          <Toggle.LabelText style={[t.atoms.text, a.font_normal, a.text_md]}>
            <Trans context="enable for">No one</Trans>
          </Toggle.LabelText>
        </Toggle.Item>
      </View>
    </Toggle.Group>
  )
}
