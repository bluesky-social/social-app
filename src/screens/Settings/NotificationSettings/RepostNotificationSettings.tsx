import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'RepostNotificationSettings'
>
export function RepostNotificationSettingsScreen({}: Props) {
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            label={_(msg`Settings for reply, mention, and quote notifications`)}
            to="/settings/notifications/replies"
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={BubbleIcon} />
          </SettingsList.LinkItem>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
