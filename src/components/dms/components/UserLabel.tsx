import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function UserLabel({message}: {message: string}) {
  const t = useTheme()
  return (
    <View style={[a.px_lg, a.py_sm]}>
      <Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_high]}>
        {message}
      </Text>
    </View>
  )
}
