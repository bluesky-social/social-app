import {useState} from 'react'
import {RefreshControl, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {
  EXPLORE_ARTICLES_FEEDBACK,
  EXPLORE_PHOTOS_FEEDBACK,
  EXPLORE_SECTION_PADDING,
} from '#/screens/Atmosphere/const'
import {
  getAtmosphereArticles,
  getAtmosphereExploreApps,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
  getAtmospherePublications,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {useExploreFeedback} from '#/screens/Atmosphere/feedback'
import {useAtmosphereMetricContext} from '#/screens/Atmosphere/metrics/context'
import {useLoadMetrics} from '#/screens/Atmosphere/metrics/useLoadMetrics'
import {atoms as a, useTheme} from '#/alf'
import * as Gallery from '#/components/Gallery'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/analytics'
import {AtmosphereNux} from './components/AtmosphereNux'
import {FeaturedApps} from './components/FeaturedApps'
import {FeaturedArticles} from './components/FeaturedArticles'
import {FeaturedLivestreams} from './components/FeaturedLivestreams'
import {FeaturedPhotos} from './components/FeaturedPhotos'
import {FeaturedPublications} from './components/FeaturedPublications'

export function AtmosphereExploreTab({
  onPressSeeMoreApps: onPressSeeMoreAppsProp,
}: {
  onPressSeeMoreApps?: () => void
}) {
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const onPressSeeMoreApps =
    onPressSeeMoreAppsProp &&
    (() => {
      if (metricContext) {
        ax.metric('atmosphere:section:seeMore', {
          ...metricContext,
          section: 'apps',
          destinationTab: 'apps',
        })
      }
      onPressSeeMoreAppsProp()
    })
  const t = useTheme()
  const {t: l} = useLingui()
  const {data, isError, isPending, refetch} = useAtmosphereExploreQuery()
  const moderationOpts = useModerationOpts()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const articleFeedback = useExploreFeedback(
    EXPLORE_ARTICLES_FEEDBACK,
    data?.articles.recIdStr,
  )
  const photoFeedback = useExploreFeedback(
    EXPLORE_PHOTOS_FEEDBACK,
    data?.photos.recIdStr,
  )
  const apps = data ? getAtmosphereExploreApps(data) : []
  const articles = data ? getAtmosphereArticles(data, moderationOpts) : []
  const livestreams = data ? getAtmosphereLivestreams(data) : []
  const photos = data ? getAtmospherePhotos(data, moderationOpts) : []
  const publications = data
    ? getAtmospherePublications(data, moderationOpts)
    : []
  const metrics = useLoadMetrics({
    // Moderated sections stay empty until moderation options load
    hasData: !!data && !!moderationOpts,
    isError,
    itemCount:
      apps.length +
      articles.length +
      livestreams.length +
      photos.length +
      publications.length,
  })

  async function onRefresh() {
    metrics.logRefresh()
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={t.atoms.text.color}
      titleColor={t.atoms.text.color}
    />
  )

  const errorMessage = (
    <ErrorMessage
      message={l`Could not load Atmosphere content. Please try again.`}
      onPressTryAgain={() => {
        metrics.logRetry('initial')
        void refetch()
      }}
    />
  )

  if (!data) {
    return (
      <Layout.Content
        testID="atmosphereExploreTab"
        alwaysBounceVertical
        refreshControl={refreshControl}
        contentContainerStyle={[a.pb_xl]}>
        {isPending ? (
          <View
            testID="atmosphereExploreTabLoading"
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={l`Loading Atmosphere content`}
            accessibilityHint=""
            style={[a.align_center, a.justify_center, a.py_5xl]}>
            <Loader size="xl" />
          </View>
        ) : isError ? (
          errorMessage
        ) : undefined}
      </Layout.Content>
    )
  }

  return (
    <Layout.Content
      testID="atmosphereExploreTab"
      alwaysBounceVertical
      refreshControl={refreshControl}
      contentContainerStyle={[a.pb_xl]}>
      <Gallery.Bleed>
        <View style={[a.gap_lg, a.py_lg]}>
          {isError ? (
            <View style={{paddingHorizontal: EXPLORE_SECTION_PADDING}}>
              {errorMessage}
            </View>
          ) : undefined}
          <AtmosphereNux />
          <FeaturedApps apps={apps} onPressSeeMore={onPressSeeMoreApps} />
          <FeaturedArticles articles={articles} feedback={articleFeedback} />
          <FeaturedLivestreams livestreams={livestreams} />
          <FeaturedPhotos photos={photos} feedback={photoFeedback} />
          <FeaturedPublications publications={publications} />
        </View>
      </Gallery.Bleed>
    </Layout.Content>
  )
}
