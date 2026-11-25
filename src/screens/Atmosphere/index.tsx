import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {AboutAtmosphereDialog} from '#/screens/Atmosphere/components/AboutAtmosphereDialog'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CircleInfo_Stroke2_Corner0_Rounded as InfoIcon} from '#/components/icons/CircleInfo'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {AtmosphereAppsTab} from './AppsTab'
import {CombinedTab} from './CombinedTab'
import {AtmosphereMetricsScope} from './metrics/context'
import {type AtmosphereTab} from './metrics/types'
import {useTabMetrics} from './metrics/useTabMetrics'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Atmosphere'>

/** In pager order, matching the sections below. */
const TABS: AtmosphereTab[] = ['combined', 'apps']

export function AtmosphereScreen({}: Props) {
  const ax = useAnalytics()

  if (!ax.features.enabled(ax.features.AtmosphereScreenEnable)) {
    return <NotFoundScreen />
  }

  return <AtmosphereScreenInner />
}

function AtmosphereScreenInner() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const aboutDialogControl = Dialog.useDialogControl()
  const tabMetrics = useTabMetrics(TABS)

  const sections = [
    // Named Explore, though its metrics still call it the combined tab
    {title: l`Explore`, component: <CombinedTab />},
    {title: l`Apps`, component: <AtmosphereAppsTab />},
  ]

  return (
    <Layout.Screen testID="atmosphereScreen">
      <Pager
        testID="atmospherePager"
        initialPage={0}
        onTabPressed={tabMetrics.onTabPressed}
        onPageSelected={tabMetrics.onPageSelected}
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
              <Layout.Header.Slot>
                <Button
                  testID="atmosphereAboutButton"
                  label={l`About the Atmosphere`}
                  accessibilityHint={l`Opens a dialog with more information about the Atmosphere`}
                  size="small"
                  color="secondary"
                  variant="ghost"
                  shape="round"
                  hitSlop={HITSLOP_10}
                  onPress={() => {
                    ax.metric('atmosphere:about:open', {})
                    aboutDialogControl.open()
                  }}
                  style={[{right: -3}]}>
                  <ButtonIcon icon={InfoIcon} size="md" />
                </Button>
              </Layout.Header.Slot>
            </Layout.Header.Outer>
            <TabBar
              testID="atmosphereTabBar"
              items={sections.map(section => section.title)}
              {...props}
            />
          </Layout.Center>
        )}>
        {sections.map((section, index) => (
          <View key={section.title} style={a.flex_1}>
            <AtmosphereMetricsScope
              tab={TABS[index]}
              surface="tab"
              isActive={tabMetrics.isShowing && tabMetrics.page === index}>
              {section.component}
            </AtmosphereMetricsScope>
          </View>
        ))}
      </Pager>
      <AboutAtmosphereDialog control={aboutDialogControl} />
    </Layout.Screen>
  )
}
