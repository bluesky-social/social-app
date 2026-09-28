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

const ANTI_HARASSMENT =
  'https://bsky.social/about/support/community-guidelines#:~:text=coordinated%20harassment%20campaigns.-,Anti%2DHarassment,-%3A%20We%20create%20space'

export function ModerationInboxSubjectDetailsScreen() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="moderationInboxSubjectDetailsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Notice</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            <Trans>Bluesky Moderation Service</Trans>
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_lg, a.gap_lg]}>
          <ActionSummaryText
            header={l`Appeal approved: Your post has been restored`}>
            <Trans>
              A moderator reviewed your appeal and reversed the original
              decision. Your post has been restored and is visible again.
            </Trans>
          </ActionSummaryText>

          <ContentBlock header={l`Restored post`}>
            <SubjectPreview />

            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Rule violated:</Trans>
              </Text>
              <Text style={[a.text_md]}>
                <Trans>
                  <InlineLinkText
                    to={ANTI_HARASSMENT}
                    label={l`Community Guidelines: Harassment`}
                    style={[a.text_md]}>
                    Community Guidelines: Harassment
                  </InlineLinkText>
                </Trans>
              </Text>
            </View>
          </ContentBlock>

          <Timeline
            items={[
              {
                title: l`Post created`,
              },
              {
                title: l`Post removed`,
              },
              {
                title: l`Appeal submitted`,
              },
              {
                title: l`Appeal approved, post restored`,
              },
            ]}
          />
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
