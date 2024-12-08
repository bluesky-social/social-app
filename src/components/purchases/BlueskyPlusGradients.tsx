import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'

import {atoms as a, tokens, useTheme, ViewStyleProp} from '#/alf'

const dark = tokens.gradients.nordic
const light = {
  values: [
    [0, '#0F62C7'],
    [1, '#9EE8C1'],
  ],
} as const

export function SubduedFill({style}: ViewStyleProp) {
  const t = useTheme()
  const isDark = t.name !== 'light'
  const gradient = isDark ? dark : light

  return (
    <View style={[a.absolute, a.inset_0, t.atoms.bg]}>
      <LinearGradient
        colors={gradient.values.map(c => c[1]) as [string, string, ...string[]]}
        locations={
          gradient.values.map(c => c[0]) as [number, number, ...number[]]
        }
        start={{x: 0, y: 1}}
        end={{x: 1, y: 1}}
        style={[a.absolute, a.inset_0, {opacity: 0.3}, style]}
      />
    </View>
  )
}
