import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {logger} from '#/logger'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useSetVerificationPrefsMutation} from '#/state/queries/preferences'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useGutters} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '#/components/icons/CircleCheck'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'

export function Screen() {
  const {_} = useLingui()
  const gutters = useGutters(['base'])
  const {data: preferences} = usePreferencesQuery()

  return (
    <Layout.Screen testID="ModerationVerificationSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Verification Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Admonition type="tip" style={[a.flex_1]}>
              <Trans>
                Verifications on Bluesky work differently than on other
                platforms.{' '}
                <InlineLinkText
                  overridePresentation
                  to={urls.website.blog.initialVerificationAnnouncement}
                  label={_(msg`Learn more`)}
                  onPress={() => {
                    logger.metric(
                      'verification:learn-more',
                      {
                        location: 'verificationSettings',
                      },
                      {statsig: true},
                    )
                  }}>
                  Learn more here.
                </InlineLinkText>
              </Trans>
            </Admonition>
          </SettingsList.Item>
          {preferences ? (
            <Inner preferences={preferences} />
          ) : (
            <View style={[gutters, a.justify_center, a.align_center]}>
              <Loader size="xl" />
            </View>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Inner({preferences}: {preferences: UsePreferencesQueryResponse}) {
  const {_} = useLingui()
  const {hideBadges} = preferences.verificationPrefs
  const {mutate: setVerificationPrefs, isPending} =
    useSetVerificationPrefsMutation()

  return (
    <Toggle.Item
      type="checkbox"
      name="hideBadges"
      label={_(msg`Hide verification badges`)}
      value={hideBadges}
      disabled={isPending}
      onChange={value => {
        setVerificationPrefs({hideBadges: value})
      }}>
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={CircleCheck} />
        <SettingsList.ItemText>
          <Trans>Hide verification badges</Trans>
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}
