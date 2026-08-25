import {Trans} from '@lingui/react/macro'

import {NotFoundScreen} from '#/view/screens/NotFound'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'

export function ModerationInboxScreen() {
  const ax = useAnalytics()
  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="moderationInboxScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Moderation inbox</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
    </Layout.Screen>
  )
}
