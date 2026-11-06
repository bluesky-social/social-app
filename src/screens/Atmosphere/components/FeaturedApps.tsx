import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import {ExploreGallery} from './ExploreGallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {FeaturedAppCard} from './FeaturedAppCard'

const CARD_WIDTH = 320

export function FeaturedApps({apps}: {apps: FeaturedApp[]}) {
  const {t: l} = useLingui()

  if (!apps.length) return null

  return (
    <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      <ExploreSectionHeader title={l`Featured apps`} />
      <ExploreGallery
        items={apps}
        getKey={app => app.id}
        label={l`Featured apps`}
        testID="atmosphereAppsGallery"
        renderItem={(app, galleryFocus) => (
          <View style={[a.flex_grow, {width: CARD_WIDTH}]}>
            <FeaturedAppCard app={app} galleryFocus={galleryFocus} />
          </View>
        )}
      />
    </View>
  )
}
