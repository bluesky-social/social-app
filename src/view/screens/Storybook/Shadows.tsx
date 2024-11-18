import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {H1, Text} from '#/components/Typography'

export function Shadows() {
  const t = useTheme()

  return (
    <View style={[a.gap_md]}>
      <H1>Shadows</H1>

      <View style={[a.flex_row, a.gap_5xl]}>
        <View
          style={[
            a.flex_1,
            a.justify_center,
            a.px_lg,
            a.py_2xl,
            t.atoms.bg,
            t.atoms.shadow_sm,
          ]}>
          <Text>shadow_sm</Text>
        </View>

        <View
          style={[
            a.flex_1,
            a.justify_center,
            a.px_lg,
            a.py_2xl,
            t.atoms.bg,
            t.atoms.shadow_md,
          ]}>
          <Text>shadow_md</Text>
        </View>

        <View
          style={[
            a.flex_1,
            a.justify_center,
            a.px_lg,
            a.py_2xl,
            t.atoms.bg,
            t.atoms.shadow_lg,
          ]}>
          <Text>shadow_lg</Text>
        </View>
      </View>
    </View>
  )
}
