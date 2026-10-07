import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {AnnouncementBanner} from './components/AnnouncementBanner'
import {FeaturedApps} from './components/FeaturedApps'
import {FeaturedArticles} from './components/FeaturedArticles'
import {FeaturedLivestreams} from './components/FeaturedLivestreams'
import {FeaturedPhotos} from './components/FeaturedPhotos'
import {
  getAtmosphereAnnouncementBanner,
  getAtmosphereApps,
  getAtmosphereArticles,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
} from './exploreData'
import {livestreamPreviewFixture} from './fixtures/livestreamPreview'

const articles = getAtmosphereArticles()
const apps = getAtmosphereApps()
const announcementBanner = getAtmosphereAnnouncementBanner()
const livestreams = getAtmosphereLivestreams({
  livestreams: livestreamPreviewFixture,
})
const photos = getAtmospherePhotos()

export function AtmosphereExploreTab() {
  return (
    <Layout.Content
      testID="atmosphereExploreTab"
      contentContainerStyle={[a.pb_xl]}>
      <View style={[a.gap_lg, a.px_lg, a.py_lg]}>
        <AnnouncementBanner banner={announcementBanner} />
        <FeaturedArticles articles={articles} />
        <FeaturedLivestreams livestreams={livestreams} />
        <FeaturedPhotos photos={photos} />
        <FeaturedApps apps={apps} />
      </View>
    </Layout.Content>
  )
}
