import {LinearGradient} from 'expo-linear-gradient'

import {atoms as a, useTheme, utils} from '#/alf'

export function Gradient() {
  const t = useTheme()
  return (
    <LinearGradient
      colors={[
        utils.alpha(t.palette.primary_500, 0.2),
        utils.alpha(t.palette.primary_500, 0.1),
      ]}
      locations={[0, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[a.absolute, a.inset_0]}
    />
  )
}
