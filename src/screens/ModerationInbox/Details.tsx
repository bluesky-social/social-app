import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {ActionSummaryText} from './components/ActionSummaryText'
import {ContentBlock} from './components/ContentBlock'
import {SubjectPreview} from './components/SubjectPreview'
import {Timeline} from './components/Timeline'

export function ModerationInboxReportDetailsScreen() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  // TODO This is a placeholder value. -dsb
  const note = 'Lorem ipsum dolor sit amet.'

  return (
    <Layout.Screen testID="moderationInboxReportDetailsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Your report</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            <Trans>Bluesky Moderation Service</Trans>
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_lg, a.gap_lg]}>
          <ActionSummaryText header={l`The post was restored`}>
            <Trans>
              The post you reported has been restored after another review. If
              you’d rather not see it, you can mute or block the account. Read
              our{' '}
              <InlineLinkText
                to="https://bsky.social/about/support/community-guidelines"
                label={l`Read our Community Guidelines`}
                style={[a.text_md]}>
                Community Guidelines
              </InlineLinkText>
              .
            </Trans>
          </ActionSummaryText>

          <ContentBlock header={l`What you reported`}>
            <SubjectPreview />

            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Reason:</Trans>
              </Text>
              <Text style={[a.text_md]}>
                <Trans>Spam</Trans>
              </Text>
            </View>

            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Your note:</Trans>
              </Text>
              <Text emoji style={[a.text_md]}>
                <Trans>“{note}”</Trans>
              </Text>
            </View>
          </ContentBlock>

          <Timeline
            items={[
              {
                title: l`Report submitted`,
              },
              {
                title: l`Post removed`,
              },
              {
                title: l`Post restored`,
              },
            ]}
          />
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
