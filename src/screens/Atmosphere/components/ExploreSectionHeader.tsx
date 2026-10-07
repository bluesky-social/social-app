import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function ExploreSectionHeader({
  title,
  label,
}: {
  title: React.ReactNode
  label: string
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
      <Text accessibilityRole="header" style={[a.text_lg, a.font_semi_bold]}>
        {title}
      </Text>
      <Link
        to="/atmosphere"
        label={label}
        accessibilityHint=""
        onPress={event => {
          event.preventDefault()
          return false
        }}>
        {({pressed, hovered}) => {
          const color =
            pressed || hovered ? t.palette.contrast_800 : t.palette.contrast_500

          return (
            <Text style={[a.text_sm, a.font_medium, {color}]}>
              <Trans>See more</Trans>
            </Text>
          )
        }}
      </Link>
    </View>
  )
}
