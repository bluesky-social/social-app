import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {
  getAtmosphereAnnouncementBanner,
  getAtmosphereApps,
  getAtmosphereArticles,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {AnnouncementBanner} from './components/AnnouncementBanner'
import {AtmosphereNux} from './components/AtmosphereNux'
import {ExploreGalleryBleed} from './components/ExploreGallery'
import {FeaturedApps} from './components/FeaturedApps'
import {FeaturedArticles} from './components/FeaturedArticles'
import {FeaturedLivestreams} from './components/FeaturedLivestreams'
import {FeaturedPhotos} from './components/FeaturedPhotos'

export function AtmosphereExploreTab() {
  const {t: l} = useLingui()
  const {data, isError, isPending, refetch} = useAtmosphereExploreQuery()

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
      contentContainerStyle={[a.pb_xl]}>
      <ExploreGalleryBleed>
        <View style={[a.gap_lg, a.px_lg, a.py_lg]}>
          {isError ? errorMessage : undefined}
          <AtmosphereNux />
          {announcementBanner ? (
            <AnnouncementBanner banner={announcementBanner} />
          ) : undefined}
          <FeaturedArticles articles={getAtmosphereArticles(data)} />
          <FeaturedLivestreams livestreams={getAtmosphereLivestreams(data)} />
          <FeaturedPhotos photos={getAtmospherePhotos(data)} />
          <FeaturedApps apps={getAtmosphereApps(data)} />
        </View>
      </ExploreGalleryBleed>
    </Layout.Content>
  )
}
