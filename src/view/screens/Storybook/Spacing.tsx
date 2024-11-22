import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {H1, Text} from '#/components/Typography'

export function Spacing() {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <H1>Spacing</H1>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>2xs (2px)</Text>
        <View style={[a.flex_1, a.pt_2xs, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>xs (4px)</Text>
        <View style={[a.flex_1, a.pt_xs, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>sm (8px)</Text>
        <View style={[a.flex_1, a.pt_sm, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>md (12px)</Text>
        <View style={[a.flex_1, a.pt_md, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>lg (16px)</Text>
        <View style={[a.flex_1, a.pt_lg, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>xl (20px)</Text>
        <View style={[a.flex_1, a.pt_xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>2xl (24px)</Text>
        <View style={[a.flex_1, a.pt_2xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>3xl (28px)</Text>
        <View style={[a.flex_1, a.pt_3xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>4xl (32px)</Text>
        <View style={[a.flex_1, a.pt_4xl, t.atoms.bg_contrast_300]} />
      </View>

      <View style={[a.flex_row, a.align_center]}>
        <Text style={{width: 80}}>5xl (40px)</Text>
        <View style={[a.flex_1, a.pt_5xl, t.atoms.bg_contrast_300]} />
      </View>
    </View>
  )
}
