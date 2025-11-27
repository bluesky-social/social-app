import {Trans} from '@lingui/macro'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Contacts_Stroke2_Corner2_Rounded as SyncContactsIcon} from '#/components/icons/Contacts'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<AllNavigatorParams, 'SyncContactsSettings'>
export function SyncContactsSettingsScreen({}: Props) {
  const t = useTheme()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Sync contacts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <SettingsList.ItemIcon icon={SyncContactsIcon} />
            <SettingsList.ItemText>
              <Trans>Sync Contacts</Trans>
            </SettingsList.ItemText>
          </SettingsList.Item>
          <SettingsList.Item style={[a.pt_0]}>
            <Text
              style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
              <Trans>
                Contacts from your address book will be uploaded to Bluesky on
                an ongoing basis to help connect you with your friends and
                personalize content, such as making suggestions for you and
                others. Turning off syncing will not remove previously uploaded
                contacts.{' '}
                <InlineLinkText to="#" label="todo">
                  TODO: Add learn more link
                </InlineLinkText>
              </Trans>
            </Text>
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
