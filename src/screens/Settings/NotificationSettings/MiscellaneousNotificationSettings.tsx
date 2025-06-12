import {Trans} from '@lingui/macro'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import * as Layout from '#/components/Layout'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'MiscellaneousNotificationSettings'
>
export function MiscellaneousNotificationSettingsScreen({}: Props) {
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
            <SettingsList.ItemIcon icon={ShapesIcon} />
            <ItemTextWithSubtitle
              bold
              titleText={<Trans>Everything else</Trans>}
              subtitleText={
                <Trans>
                  Notifications for everything else, such as when someone joins
                  via one of your starter packs.
                </Trans>
              }
            />
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
