import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a, useTheme} from '#/alf'
import {ButtonText} from '#/components/Button'
import {Contacts_Stroke2_Corner2_Rounded as SyncContactsIcon} from '#/components/icons/Contacts'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<AllNavigatorParams, 'SyncContactsSettings'>
export function SyncContactsSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()

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
      {isNative ? (
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
                style={[
                  a.text_sm,
                  t.atoms.text_contrast_medium,
                  a.leading_snug,
                ]}>
                <Trans>
                  Contacts from your address book will be uploaded to Bluesky on
                  an ongoing basis to help connect you with your friends and
                  personalize content, such as making suggestions for you and
                  others. Turning off syncing will not remove previously
                  uploaded contacts.{' '}
                  <InlineLinkText to="#" label="todo">
                    TODO: Add learn more link
                  </InlineLinkText>
                </Trans>
              </Text>
            </SettingsList.Item>
            <SettingsList.Item>
              <Link
                to={{screen: 'SyncContactsFlow'}}
                label={_(msg`Upload contacts`)}
                size="large"
                color="primary"
                style={[a.flex_1, a.justify_center]}>
                <ButtonText>
                  <Trans>Upload contacts</Trans>
                </ButtonText>
              </Link>
            </SettingsList.Item>
          </SettingsList.Container>
        </Layout.Content>
      ) : (
        <ErrorScreen
          title={_(msg`Not available on this platform.`)}
          message={_(msg`Please use the native app to sync your contacts.`)}
          showHeader
        />
      )}
    </Layout.Screen>
  )
}
