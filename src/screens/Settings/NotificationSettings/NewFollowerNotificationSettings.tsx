import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {PersonPlus_Stroke2_Corner2_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'
import {PreferenceControls} from './components/PreferenceControls'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'NewFollowerNotificationSettings'
>
export function NewFollowerNotificationSettingsScreen({}: Props) {
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
            <SettingsList.ItemIcon icon={PersonPlusIcon} />
            <ItemTextWithSubtitle
              bold
              titleText={<Trans>New followers</Trans>}
              subtitleText={
                <Trans>Get notifications when people follow you.</Trans>
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
            <PreferenceControls
              name="follow"
              preference={preferences?.follow}
            />
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
