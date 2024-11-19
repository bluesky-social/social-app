import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'

export function PlayButtonIcon({size = 32}: {size?: number}) {
  const t = useTheme()
  const bg = t.name === 'light' ? t.palette.contrast_25 : t.palette.contrast_975
  const fg = t.name === 'light' ? t.palette.contrast_975 : t.palette.contrast_25

  return (
    <View
      style={[
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        t.atoms.shadow_lg,
        {
          width: size + size / 1.5,
          height: size + size / 1.5,
        },
      ]}>
      <View
        style={[
          a.absolute,
          a.inset_0,
          {
            backgroundColor: bg,
            opacity: 0.7,
          },
        ]}
      />
      <PlayIcon
        width={size}
        fill={fg}
        style={[
          a.relative,
          a.z_10,
          {
            left: size / 50,
          },
        ]}
      />
    </View>
  )
}
