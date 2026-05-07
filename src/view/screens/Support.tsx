import {lazy, Suspense} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

// Lazy-loaded so the Stripe SDK (and the js.stripe.com script it injects) are
// only fetched when the user actually navigates to this screen.
const SupportStripeCheckout = lazy(() => import('./SupportStripeCheckout'))

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>
export const SupportScreen = (_props: Props) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Support</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_xl, a.gap_xl]}>
          <View
            style={[
              a.p_lg,
              a.rounded_md,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
            ]}>
            <Text style={[a.text_lg, a.font_bold, a.pb_sm]}>
              <Trans>OpenCollective</Trans>
            </Text>
            <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                Support the Blacksky community through OpenCollective. Your
                contributions help us maintain and improve the platform.
              </Trans>
            </Text>
            <View style={[a.pt_md]}>
              <InlineLinkText
                to="https://opencollective.com/blacksky"
                label={_(msg`Support on OpenCollective`)}>
                <Trans>Support on OpenCollective</Trans>
              </InlineLinkText>
            </View>
          </View>

          <Suspense fallback={null}>
            <SupportStripeCheckout />
          </Suspense>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
