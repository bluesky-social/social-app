import {Trans} from '@lingui/macro'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'LikeNotificationSettings'
>
export function LikeNotificationSettingsScreen({}: Props) {
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
            <SettingsList.ItemIcon icon={HeartIcon} />
            <ItemTextWithSubtitle
              bold
              titleText={<Trans>Likes</Trans>}
              subtitleText={
                <Trans>Get notifications when people like your posts.</Trans>
              }
            />
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
