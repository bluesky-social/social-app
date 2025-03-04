import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'

/**
 * GlassyBackdrop component
 * On web, it applies a backdrop filter to create a glassy effect.
 * On native and non-safari mobile web, it's just a solid color.
 */
export function GlassyBackdrop() {
  const t = useTheme()
  return <View style={[a.absolute, a.inset_0, t.atoms.bg]} />
}
