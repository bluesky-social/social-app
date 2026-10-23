import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

export function ExploreSectionHeader({title}: {title: React.ReactNode}) {
  return (
    <Text accessibilityRole="header" style={[a.text_lg, a.font_semi_bold]}>
      {title}
    </Text>
  )
}
