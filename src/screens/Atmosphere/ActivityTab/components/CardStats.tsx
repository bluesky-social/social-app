import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme} from '#/alf'
import {Heart2_Stroke2_Corner0_Rounded as LikeIcon} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner2_Rounded as ImageIcon} from '#/components/icons/Image'
import {Text} from '#/components/Typography'

/** The "likes · photos" meta line on gallery and livestream cards. */
export function CardStats({
  likeCount,
  photoCount,
}: {
  date?: string
  likeCount?: number
  photoCount?: number
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const textStyle = [a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]

  if (!likeCount && !photoCount) return null

  return (
    <View style={[a.flex_row, a.align_center, a.gap_md]}>
      {!!likeCount && (
        <View
          accessible
          accessibilityLabel={l({
            message: plural(likeCount, {one: '# like', other: '# likes'}),
            comment: 'Accessibility label for a like count on a card.',
          })}
          accessibilityHint=""
          style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <LikeIcon size="xs" style={t.atoms.text_contrast_medium} />
          <Text style={textStyle}>{formatCount(i18n, likeCount)}</Text>
        </View>
      )}
      {!!photoCount && (
        <View
          accessible
          accessibilityLabel={l({
            message: plural(photoCount, {one: '# photo', other: '# photos'}),
            comment:
              'Accessibility label for the number of photos in a gallery.',
          })}
          accessibilityHint=""
          style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <ImageIcon size="xs" style={t.atoms.text_contrast_medium} />
          <Text style={textStyle}>{formatCount(i18n, photoCount)}</Text>
        </View>
      )}
    </View>
  )
}
