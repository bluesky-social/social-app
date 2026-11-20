import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {formatCount} from '#/view/com/util/numeric/format'
import {getGalleryImages} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {useAtmosphereLikeCount} from '#/components/atmosphere/likes'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner2_Rounded as ImageIcon} from '#/components/icons/Image'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/**
 * A gallery's favorite and photo counts, with the viewer's optimistic
 * favorite, plus a label for them. The pills are hidden from screen readers,
 * so cards add `label` to their own.
 */
export function useGalleryCounts(view: app.bsky.embed.external.ViewGallery) {
  const {t: l, i18n} = useLingui()
  const favoriteCount = useAtmosphereLikeCount(view, 'favorite')
  const photoCount = view.photoCount ?? getGalleryImages(view).length

  const photoCountText = formatCount(i18n, photoCount)
  const favoriteCountText = formatCount(i18n, favoriteCount)

  const photos = l({
    message: plural(photoCount, {
      one: `${photoCountText} photo`,
      other: `${photoCountText} photos`,
    }),
    comment: 'Number of photos in a gallery, read out by screen readers.',
  })
  const favorites = l({
    message: plural(favoriteCount, {
      one: `${favoriteCountText} favorite`,
      other: `${favoriteCountText} favorites`,
    }),
    comment:
      'Number of people who favorited (liked) a photo gallery, read out by screen readers.',
  })
  const label =
    favoriteCount > 0
      ? l({
          message: `${favorites}, ${photos}`,
          comment:
            'Screen reader summary of a photo gallery, e.g. “3 favorites, 12 photos”. Both counts are already translated.',
        })
      : photos

  return {favoriteCount, photoCount, label}
}

/** Favorite and photo counts over a gallery's cover photo. */
export function GalleryCountPills({
  favoriteCount,
  photoCount,
}: {
  favoriteCount: number
  photoCount: number
}) {
  const {i18n} = useLingui()
  const t = useTheme()

  const pillStyle = [
    a.flex_row,
    a.align_center,
    a.gap_2xs,
    a.rounded_full,
    t.atoms.bg,
    {paddingVertical: 5, paddingHorizontal: 7},
  ]
  const textStyle = [
    a.text_xs,
    a.font_medium,
    t.atoms.text,
    {fontVariant: ['tabular-nums' as const]},
  ]

  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={[a.absolute, a.flex_row, a.gap_xs, {top: 8, left: 8}]}>
      {favoriteCount > 0 ? (
        <View testID="atmospherePhotoCardLikes" style={pillStyle}>
          <Heart size="xs" fill={t.atoms.text.color} />
          <Text style={textStyle}>{formatCount(i18n, favoriteCount)}</Text>
        </View>
      ) : undefined}
      <View testID="atmospherePhotoCardPhotos" style={pillStyle}>
        <ImageIcon size="xs" fill={t.atoms.text.color} />
        <Text style={textStyle}>{formatCount(i18n, photoCount)}</Text>
      </View>
    </View>
  )
}
