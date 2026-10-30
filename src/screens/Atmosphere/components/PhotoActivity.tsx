import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {ACTIVITY_ROW_PADDING_START} from '#/screens/Atmosphere/constants'
import {isSafeWebUrl} from '#/screens/Atmosphere/externalViews'
import {getGrainPhotos} from '#/screens/Atmosphere/photos'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {activityCollections} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {Heart2_Filled_Stroke2_Corner0_Rounded as FavoriteIcon} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner2_Rounded as PhotoIcon} from '#/components/icons/Image'
import {GalleryBleed} from '#/components/images/Gallery'
import {InlineLinkText} from '#/components/Link'
import {ImageEmbed} from '#/components/Post/Embed/ImageEmbed'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {ActivityCounts} from './ActivityCounts'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
  ActivityRowContent,
} from './ActivityPrimitives'

export function GrainGalleryActivityRenderer({
  item,
  computedItemView,
  testID,
  actions,
}: ActivityRendererProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  if (!first) return null
  const images = getGrainPhotos(item)
  const gallery = bsky.isType(app.bsky.embed.external.viewGallery, first.view)
    ? first.view
    : undefined
  const href = gallery && isSafeWebUrl(gallery.uri) ? gallery.uri : undefined
  const title = gallery?.title.trim() || l`Gallery`
  const favorite = first.collection === activityCollections.grainFavorite
  const count = item.type === 'group' ? item.group.items.length : 1
  const timestamp =
    item.type === 'group' ? item.group.indexedAt : first.record.indexedAt
  const action = favorite
    ? count === 1
      ? l`favorited a gallery`
      : l`favorited ${plural(count, {one: '# gallery', other: '# galleries'})}`
    : count === 1
      ? l`posted a gallery`
      : l`posted ${plural(count, {one: '# gallery', other: '# galleries'})}`
  const metadata = (
    <ActivityActorLine
      actors={computedItemView.actors}
      action={action}
      timestamp={timestamp}
      showAvatars={false}
    />
  )
  return (
    <View
      testID={testID}
      style={[a.pr_lg, {paddingLeft: ACTIVITY_ROW_PADDING_START}]}>
      {images.length > 0 ? (
        <ActivityRowContent
          actors={computedItemView.actors}
          icon={favorite ? FavoriteIcon : PhotoIcon}
          iconColor={favorite ? t.palette.pink : undefined}
          actions={actions}
          header={metadata}>
          <GalleryBleed>
            <View testID="atmospherePhotoCard">
              <ActivityCard padded={false}>
                <ImageEmbed
                  embed={{
                    type: 'gallery',
                    view: {
                      $type: 'app.bsky.embed.gallery#view',
                      items: images.map(image => ({
                        $type: 'app.bsky.embed.gallery#viewImage',
                        thumbnail: image.thumb,
                        fullsize: image.fullsize,
                        alt: image.alt,
                        aspectRatio: image.aspectRatio,
                      })),
                    },
                  }}
                  viewContext={PostEmbedViewContext.Feed}
                  style={{marginTop: 0}}
                />
                <View style={[a.px_md, a.py_sm, a.gap_xs]}>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <View style={[a.flex_1, {minWidth: 0}]}>
                      {gallery ? (
                        href ? (
                          <InlineLinkText
                            to={href}
                            label={title}
                            emoji
                            style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                            {title}
                          </InlineLinkText>
                        ) : (
                          <Text emoji style={[a.text_md, a.font_semi_bold]}>
                            {title}
                          </Text>
                        )
                      ) : null}
                    </View>
                    <ActivityCounts
                      view={first.view}
                      size="large"
                      style={a.flex_shrink_0}
                    />
                  </View>
                  {gallery?.description.trim() ? (
                    <Text
                      emoji
                      style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {gallery.description}
                    </Text>
                  ) : null}
                </View>
              </ActivityCard>
            </View>
          </GalleryBleed>
        </ActivityRowContent>
      ) : (
        <ActivityFootnote
          title={gallery?.title.trim() || l`Gallery unavailable`}
          to={href}
          icon={favorite ? FavoriteIcon : PhotoIcon}
          iconColor={favorite ? t.palette.pink : undefined}
          actors={computedItemView.actors}
          action={action}
          timestamp={timestamp}
          actions={actions}>
          <ActivityCounts view={first.view} />
        </ActivityFootnote>
      )}
    </View>
  )
}
