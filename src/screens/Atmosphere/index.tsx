import {useRef} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Pager, type PagerRef} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {ActivityTab} from './ActivityTab'
import {AtmosphereAppsTab} from './AppsTab'
import {AtmosphereExploreTab} from './ExploreTab'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Atmosphere'>

/** Matches the Apps position in the sections below. */
const APPS_TAB_INDEX = 2

export function AtmosphereScreen({}: Props) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const pagerRef = useRef<PagerRef>(null)

  if (!ax.features.enabled(ax.features.AtmosphereScreenEnable)) {
    return <NotFoundScreen />
  }

  const sections = [
    {title: l`Following`, component: <ActivityTab />},
    {
      title: l`Explore`,
      component: (
        <AtmosphereExploreTab
          onPressSeeMoreApps={() => pagerRef.current?.setPage(APPS_TAB_INDEX)}
        />
      ),
    },
    {title: l`Apps`, component: <AtmosphereAppsTab />},
  ]

  return (
    <Layout.Screen testID="atmosphereScreen">
      <Pager
        ref={pagerRef}
        testID="atmospherePager"
        initialPage={0}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <Layout.Header.Outer noBottomBorder>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <Layout.Header.TitleText>
                    <Trans>Atmosphere</Trans>
                  </Layout.Header.TitleText>
                  <View
                    testID="atmosphereBetaBadge"
                    style={[
                      a.px_sm,
                      a.py_xs,
                      a.rounded_full,
                      {backgroundColor: t.palette.primary_100},
                    ]}>
                    <Text
                      style={[
                        a.text_xs,
                        a.font_semi_bold,
                        a.leading_tight,
                        {color: t.palette.primary_600},
                      ]}>
                      <Trans>Beta</Trans>
                    </Text>
                  </View>
                </View>
              </Layout.Header.Content>
              <Layout.Header.Slot />
            </Layout.Header.Outer>
            <TabBar
              testID="atmosphereTabBar"
              items={sections.map(section => section.title)}
              {...props}
            />
          </Layout.Center>
        )}>
        {sections.map(section => (
          <View key={section.title} style={a.flex_1}>
            {section.component}
          </View>
        ))}
      </Pager>
    </Layout.Screen>
  )
}
