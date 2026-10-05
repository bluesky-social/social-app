import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {BetaTag} from '#/components/BetaTag'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Earth'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function AtmosphereScreen() {
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const ax = useAnalytics()
  const isEnabled = ax.features.enabled(ax.features.AtmosphereExploreEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="atmosphereScreen">
      <Layout.Header.Outer noBottomBorder sticky={false}>
        {gtMobile ? <Layout.Header.Slot /> : <Layout.Header.MenuButton />}
        <Layout.Header.Content>
          <View style={[a.w_full, a.align_center]}>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <Layout.Header.TitleText style={[a.text_center]}>
                <Trans>Atmosphere</Trans>
              </Layout.Header.TitleText>
              <BetaTag />
            </View>
          </View>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Center style={[a.flex_1, a.align_center, a.justify_center]}>
        <View style={[a.align_center, a.gap_lg]}>
          <EarthIcon size="4xl" style={[t.atoms.text_contrast_low]} />
          <Text style={[a.text_2xl, a.font_semi_bold, a.text_center]}>
            <Trans>Welcome!</Trans>
          </Text>
        </View>
      </Layout.Center>
    </Layout.Screen>
  )
}
