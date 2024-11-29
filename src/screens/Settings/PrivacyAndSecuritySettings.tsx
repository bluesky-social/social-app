import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useAppPasswordsQuery} from '#/state/queries/app-passwords'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {Key_Stroke2_Corner2_Rounded as KeyIcon} from '#/components/icons/Key'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Email2FAToggle} from './components/Email2FAToggle'
import {PwiOptOut} from './components/PwiOptOut'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PrivacyAndSecuritySettings'
>
export function PrivacyAndSecuritySettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: appPasswords} = useAppPasswordsQuery()
  const {currentAccount} = useSession()

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Privacy and Security`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <SettingsList.ItemIcon
              icon={VerifiedIcon}
              color={
                currentAccount?.emailAuthFactor
                  ? t.palette.primary_500
                  : undefined
              }
            />
            <SettingsList.ItemText>
              {currentAccount?.emailAuthFactor ? (
                <Trans>Email 2FA enabled</Trans>
              ) : (
                <Trans>Two-factor authentication (2FA)</Trans>
              )}
            </SettingsList.ItemText>
            <Email2FAToggle />
          </SettingsList.Item>
          <SettingsList.LinkItem
            to="/settings/app-passwords"
            label={_(msg`App passwords`)}>
            <SettingsList.ItemIcon icon={KeyIcon} />
            <SettingsList.ItemText>
              <Trans>App passwords</Trans>
            </SettingsList.ItemText>
            {appPasswords && appPasswords.length > 0 && (
              <SettingsList.BadgeText>
                {appPasswords.length}
              </SettingsList.BadgeText>
            )}
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={EyeSlashIcon} />
            <SettingsList.ItemText>
              <Trans>Logged-out visibility</Trans>
            </SettingsList.ItemText>
            <PwiOptOut />
          </SettingsList.Group>
          <SettingsList.Item>
            <Admonition.Outer type="tip" style={[a.flex_1]}>
              <Admonition.Row>
                <Admonition.Icon />
                <View style={[a.flex_1, a.gap_sm]}>
                  <Admonition.Text>
                    <Trans>
                      Note: Bluesky is an open and public network. This setting
                      only limits the visibility of your content on the Bluesky
                      app and website, and other apps may not respect this
                      setting. Your content may still be shown to logged-out
                      users by other apps and websites.
                    </Trans>
                  </Admonition.Text>
                  <Admonition.Text>
                    <InlineLinkText
                      label={_(
                        msg`Learn more about what is public on Bluesky.`,
                      )}
                      to="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy">
                      <Trans>Learn more about what is public on Bluesky.</Trans>
                    </InlineLinkText>
                  </Admonition.Text>
                </View>
              </Admonition.Row>
            </Admonition.Outer>
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
