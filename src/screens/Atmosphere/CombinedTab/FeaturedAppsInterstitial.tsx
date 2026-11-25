import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {ExploreSectionHeader} from '#/screens/Atmosphere/components/ExploreSectionHeader'
import {FeaturedApps} from '#/screens/Atmosphere/components/FeaturedApps'
import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {getAtmosphereExploreApps} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {useAtmosphereMetricContext} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import * as Gallery from '#/components/Gallery'
import * as Skeleton from '#/components/Skeleton'
import {useAnalytics} from '#/analytics'

/** Matches `FeaturedApps`. */
const CARD_WIDTH = 320
const LOGO_SIZE = 56
/** Room for the loaded carousel's page dots. */
const PAGE_DOTS_HEIGHT = 32

/**
 * Explore's featured apps, with a skeleton while they load. Uses Explore's
 * query for now, so whichever tab loads first fills the other.
 */
export function FeaturedAppsInterstitial({
  onPressSeeMore,
}: {
  onPressSeeMore?: () => void
}) {
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const {data, isPending} = useAtmosphereExploreQuery()
  const apps = data ? getAtmosphereExploreApps(data) : []
  const onPressSeeMoreWithMetric =
    onPressSeeMore &&
    (() => {
      if (metricContext) {
        ax.metric('atmosphere:section:seeMore', {
          ...metricContext,
          section: 'apps',
          destinationTab: 'apps',
        })
      }
      onPressSeeMore()
    })

  if (isPending) {
    return <FeaturedAppsSkeleton onPressSeeMore={onPressSeeMoreWithMetric} />
  }
  if (!apps.length) return null

  return (
    <Gallery.Bleed>
      <View testID="combinedFeaturedApps" style={a.py_md}>
        <FeaturedApps apps={apps} onPressSeeMore={onPressSeeMoreWithMetric} />
      </View>
    </Gallery.Bleed>
  )
}

/** Lays out like the loaded carousel, so nothing jumps when it loads. */
function FeaturedAppsSkeleton({onPressSeeMore}: {onPressSeeMore?: () => void}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <View
      testID="combinedFeaturedAppsSkeleton"
      accessibilityRole="progressbar"
      accessibilityLabel={l`Loading featured apps`}
      accessibilityHint=""
      style={[a.py_md, a.overflow_hidden]}>
      <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
        <ExploreSectionHeader
          title={l`Featured apps`}
          seeMore={
            onPressSeeMore
              ? {label: l`See more apps`, onPress: onPressSeeMore}
              : undefined
          }
        />
        {/* Same inverted theme as the cards, so the swap isn't a flash. */}
        <ThemeProvider theme={t.name === 'light' ? 'dark' : 'light'}>
          <View style={[a.flex_row, a.gap_sm]}>
            <AppCardSkeleton />
            <AppCardSkeleton />
          </View>
        </ThemeProvider>
      </View>
      <View style={{height: PAGE_DOTS_HEIGHT}} />
    </View>
  )
}

function AppCardSkeleton() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_shrink_0,
        a.p_lg,
        a.gap_md,
        t.atoms.bg,
        {width: CARD_WIDTH, borderRadius: 24},
      ]}>
      <Skeleton.Block style={[a.w_full, a.rounded_lg, {aspectRatio: 3}]} />
      <View style={[a.flex_row, a.align_center, a.gap_md, a.pt_xs]}>
        <Skeleton.Block style={{width: LOGO_SIZE, height: LOGO_SIZE}} />
        <Skeleton.Col style={[a.gap_2xs]}>
          <Skeleton.Text style={[a.text_lg, {width: 120}]} />
          <Skeleton.Text style={[a.text_sm, {width: 160}]} />
        </Skeleton.Col>
      </View>
      <View style={[a.gap_sm]}>
        <View>
          <Skeleton.Text style={[a.text_sm, a.w_full]} />
          <Skeleton.Text style={[a.text_sm, {width: 180}]} />
        </View>
        {/* Known followers */}
        <Skeleton.Row style={[a.align_center, a.gap_xs]}>
          <Skeleton.Circle size={20} />
          <Skeleton.Text style={[a.text_sm, {width: 120}]} />
        </Skeleton.Row>
      </View>
      <View style={[a.flex_row, a.gap_sm, a.pt_xs]}>
        <Skeleton.Block style={[a.flex_1, a.rounded_full, {height: 33}]} />
        <Skeleton.Block style={[a.flex_1, a.rounded_full, {height: 33}]} />
      </View>
    </View>
  )
}
