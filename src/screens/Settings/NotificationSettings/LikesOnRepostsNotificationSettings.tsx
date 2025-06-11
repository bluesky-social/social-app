import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon} from '#/components/icons/Heart2'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'LikesOnRepostsNotificationSettings'
>
export function LikesOnRepostsNotificationSettingsScreen({}: Props) {
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
          <SettingsList.Item style={[a.align_start]}>
            <SettingsList.ItemIcon icon={LikeRepostIcon} />
            <ItemTextWithSubtitle
              bold
              titleText={<Trans>Likes on your reposts</Trans>}
              subtitleText={
                <Trans>
                  Get notifications when people like posts that you've reposted.
                </Trans>
              }
            />
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
