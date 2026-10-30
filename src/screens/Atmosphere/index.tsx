import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, web} from '#/alf'
import {BetaTag} from '#/components/BetaTag'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'
import {AtmosphereActivityTab} from './ActivityTab'
import {AtmosphereExploreTab} from './ExploreTab'

export function AtmosphereScreen() {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const isEnabled = ax.features.enabled(ax.features.AtmosphereScreenEnable)

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
        <AtmosphereActivityTab />
        <AtmosphereExploreTab />
      </Pager>
    </Layout.Screen>
  )
}
