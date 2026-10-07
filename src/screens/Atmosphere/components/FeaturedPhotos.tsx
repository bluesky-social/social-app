import {ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens} from '#/alf'
import {type AtmospherePhotoCardData} from '../exploreData'
import {ExploreSectionHeader} from './ExploreSectionHeader'
import {PhotoCard} from './PhotoCard'

const CARD_WIDTH = 160

export function FeaturedPhotos({photos}: {photos: AtmospherePhotoCardData[]}) {
  const {t: l} = useLingui()

  if (!photos.length) return null

  return (
    <View style={[a.gap_md]}>
      <ExploreSectionHeader
        title={l`Featured photos`}
        label={l`See more photos`}
      />
      <BlockDrawerGesture>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginHorizontal: -tokens.space.lg}}
          contentContainerStyle={[
            a.flex_row,
            a.flex_nowrap,
            a.align_stretch,
            a.gap_md,
            {
              paddingLeft: tokens.space.lg,
              paddingRight: tokens.space.lg,
            },
          ]}>
          {photos.map(photo => (
            <View key={photo.id} style={{width: CARD_WIDTH}}>
              <PhotoCard photo={photo} />
            </View>
          ))}
        </ScrollView>
      </BlockDrawerGesture>
    </View>
  )
}
