import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'
import {ChatPreferenceControls} from './components/PreferenceControls'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'MessageNotificationSettings'
>
export function MessageNotificationSettingsScreen({}: Props) {
  const {data: preferences, isError} = useNotificationSettingsQuery()

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
          <SettingsList.Item style={[a.align_start]}>
            <SettingsList.ItemIcon icon={MessageIcon} />
            <ItemTextWithSubtitle
              bold
              titleText={<Trans>Chat messages</Trans>}
              subtitleText={
                <Trans>Get notifications when you receive new messages.</Trans>
              }
            />
          </SettingsList.Item>
          {isError ? (
            <View style={[a.px_lg, a.pt_md]}>
              <Admonition type="error">
                <Trans>Failed to load notification settings.</Trans>
              </Admonition>
            </View>
          ) : (
            <ChatPreferenceControls preference={preferences?.chat} />
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
