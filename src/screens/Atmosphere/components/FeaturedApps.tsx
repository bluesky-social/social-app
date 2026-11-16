import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {EXPLORE_SECTION_PADDING} from '#/screens/Atmosphere/const'
import {type FeaturedApp} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {FeaturedAppCard} from './FeaturedAppCard'

const CARD_WIDTH = 320

export function FeaturedApps({
  apps,
  onPressSeeMore,
}: {
  apps: FeaturedApp[]
  onPressSeeMore?: () => void
}) {
  const {t: l} = useLingui()

  if (!apps.length) return null

  return (
    <View style={[a.gap_md, {paddingHorizontal: EXPLORE_SECTION_PADDING}]}>
      <ExploreSectionHeader
        title={l`Featured apps`}
        seeMore={
          onPressSeeMore
            ? {label: l`See more apps`, onPress: onPressSeeMore}
            : undefined
        }
      />
      <Gallery.Root
        snapToItems
        stretch
        label={l`Featured apps`}
        testID="atmosphereAppsGallery"
        footer={<Gallery.PageDots testID="atmosphereAppsGallery-dots" />}>
        {apps.map(app => (
          <Gallery.Item key={app.id} label={app.title}>
            {galleryFocus => (
              <View style={[a.flex_grow]}>
                <View style={[a.flex_grow, {width: CARD_WIDTH}]}>
                  <FeaturedAppCard app={app} galleryFocus={galleryFocus} />
                </View>
              </View>
            )}
          </Gallery.Item>
        ))}
      </Gallery.Root>
    </View>
  )
}
