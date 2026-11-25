import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'

export function ExploreSectionHeader({
  title,
  seeMore,
}: {
  title: React.ReactNode
  /**
   * Adds a trailing "See more" button. `label` is its accessible label.
   */
  seeMore?: {label: string; onPress: () => void}
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_md]}>
      <Text
        accessibilityRole="header"
        style={[a.flex_shrink, a.text_lg, a.font_semi_bold]}>
        {title}
      </Text>
      {seeMore ? (
        <Button
          testID="exploreSectionSeeMore"
          label={seeMore.label}
          onPress={seeMore.onPress}
          hitSlop={HITSLOP_10}>
          {({hovered, pressed}) => (
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_2xs,
                (hovered || pressed) && {opacity: 0.7},
              ]}>
              <Text
                style={[
                  a.text_sm,
                  a.font_medium,
                  {color: t.palette.primary_500},
                ]}>
                <Trans>See more</Trans>
              </Text>
              <ArrowRightIcon size="xs" fill={t.palette.primary_500} />
            </View>
          )}
        </Button>
      ) : undefined}
    </View>
  )
}
