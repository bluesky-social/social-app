import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme, web} from '#/alf'
import {BetaTag} from '#/components/BetaTag'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Earth'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function AtmosphereScreen() {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const isEnabled = ax.features.enabled(ax.features.AtmosphereExploreEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="atmosphereScreen">
      <Layout.Header.Outer noBottomBorder sticky={false}>
        <Layout.Header.BackButton />
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
      <Pager
        testID="atmospherePager"
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <TabBar {...props} items={[l`Activity`, l`Explore`]} />
          </Layout.Center>
        )}>
        <AtmosphereWelcome />
        <AtmosphereWelcome />
      </Pager>
    </Layout.Screen>
  )
}

function AtmosphereWelcome() {
  const t = useTheme()

  return (
    <Layout.Center style={[a.flex_1, a.align_center, a.justify_center]}>
      <View style={[a.align_center, a.gap_lg]}>
        <EarthIcon size="4xl" style={[t.atoms.text_contrast_low]} />
        <Text style={[a.text_2xl, a.font_semi_bold, a.text_center]}>
          <Trans>Welcome!</Trans>
        </Text>
      </View>
    </Layout.Center>
  )
}
