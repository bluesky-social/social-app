import {useState} from 'react'
import {RefreshControl, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {
  getAtmosphereAnnouncementBanner,
  getAtmosphereArticles,
  getAtmosphereExploreApps,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
  getAtmospherePublications,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {atoms as a, useTheme} from '#/alf'
import * as Gallery from '#/components/Gallery'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {AnnouncementBanner} from './components/AnnouncementBanner'
import {AtmosphereNux} from './components/AtmosphereNux'
import {FeaturedApps} from './components/FeaturedApps'
import {FeaturedArticles} from './components/FeaturedArticles'
import {FeaturedLivestreams} from './components/FeaturedLivestreams'
import {FeaturedPhotos} from './components/FeaturedPhotos'
import {FeaturedPublications} from './components/FeaturedPublications'

export function AtmosphereExploreTab({
  onPressSeeMoreApps,
}: {
  onPressSeeMoreApps?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {data, isError, isPending, refetch} = useAtmosphereExploreQuery()
  const moderationOpts = useModerationOpts()
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function onRefresh() {
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
      onPressTryAgain={() => void refetch()}
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

  const announcementBanner = getAtmosphereAnnouncementBanner(data)

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
          {announcementBanner ? (
            <AnnouncementBanner banner={announcementBanner} />
          ) : undefined}
          <FeaturedApps
            apps={getAtmosphereExploreApps(data)}
            onPressSeeMore={onPressSeeMoreApps}
          />
          <FeaturedArticles
            articles={getAtmosphereArticles(data, moderationOpts)}
          />
          <FeaturedLivestreams livestreams={getAtmosphereLivestreams(data)} />
          <FeaturedPhotos photos={getAtmospherePhotos(data, moderationOpts)} />
          <FeaturedPublications
            publications={getAtmospherePublications(data, moderationOpts)}
          />
        </View>
      </Gallery.Bleed>
    </Layout.Content>
  )
}
