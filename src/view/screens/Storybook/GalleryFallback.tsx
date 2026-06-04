import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {GalleryFallbackEmbed} from '#/components/Post/Embed/GalleryFallbackEmbed'
import {H1, H3} from '#/components/Typography'

export function GalleryFallback() {
  return (
    <View style={[a.gap_md]}>
      <H1>Gallery fallback (APP-2308)</H1>

      <H3>No count</H3>
      <GalleryFallbackEmbed />

      <H3>1 photo</H3>
      <GalleryFallbackEmbed count={1} />

      <H3>5 photos</H3>
      <GalleryFallbackEmbed count={5} />

      <H3>10 photos</H3>
      <GalleryFallbackEmbed count={10} />
    </View>
  )
}
