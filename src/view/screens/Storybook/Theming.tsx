import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {Palette} from './Palette'

export function Theming() {
  const t = useTheme()

  return (
    <View style={[t.atoms.bg, a.gap_lg, a.p_xl]}>
      <Palette />

      <Text style={[a.font_semi_bold, a.pt_xl, a.px_md]}>theme.atoms.text</Text>

      <View style={[a.flex_1, t.atoms.border_contrast_high, a.border_t]} />
      <Text style={[a.font_semi_bold, t.atoms.text_contrast_high, a.px_md]}>
        theme.atoms.text_contrast_high
      </Text>

      <View style={[a.flex_1, t.atoms.border_contrast_medium, a.border_t]} />
      <Text style={[a.font_semi_bold, t.atoms.text_contrast_medium, a.px_md]}>
        theme.atoms.text_contrast_medium
      </Text>

      <View style={[a.flex_1, t.atoms.border_contrast_low, a.border_t]} />
      <Text style={[a.font_semi_bold, t.atoms.text_contrast_low, a.px_md]}>
        theme.atoms.text_contrast_low
      </Text>

      <View style={[a.flex_1, t.atoms.border_contrast_low, a.border_t]} />

      <View style={[a.w_full, a.gap_md]}>
        <View style={[t.atoms.bg, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg</Text>
        </View>
        <View style={[t.atoms.bg_contrast_25, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_25</Text>
        </View>
        <View style={[t.atoms.bg_contrast_50, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_50</Text>
        </View>
        <View style={[t.atoms.bg_contrast_100, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_100</Text>
        </View>
        <View style={[t.atoms.bg_contrast_200, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_200</Text>
        </View>
        <View style={[t.atoms.bg_contrast_300, a.justify_center, a.p_md]}>
          <Text>theme.atoms.bg_contrast_300</Text>
        </View>
      </View>
    </View>
  )
}
