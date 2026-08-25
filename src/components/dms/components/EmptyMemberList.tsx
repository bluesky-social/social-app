import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function EmptyMemberList({message}: {message: string}) {
  const t = useTheme()
  return (
    <View style={[a.p_lg, a.py_xl, a.align_center, a.gap_md]}>
      <Text style={[a.text_sm, a.italic, t.atoms.text_contrast_high]}>
        {message}
      </Text>
      <Text style={[a.text_xs, t.atoms.text_contrast_low]}>(╯°□°)╯︵ ┻━┻</Text>
    </View>
  )
}
