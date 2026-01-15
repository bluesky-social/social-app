import {View} from 'react-native'

import {isTouchDevice} from '#/lib/browser'
import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'
import {IS_NATIVE, IS_WEB} from '#/env'

export function SubtleHover({
  style,
  hover,
  web = true,
  native = false,
}: ViewStyleProp & {hover: boolean; web?: boolean; native?: boolean}) {
  const t = useTheme()

  let opacity: number
  switch (t.name) {
    case 'dark':
      opacity = 0.4
      break
    case 'dim':
      opacity = 0.45
      break
    case 'light':
      opacity = 0.5
      break
  }

  const el = (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.pointer_events_none,
        a.transition_opacity,
        t.atoms.bg_contrast_50,
        style,
        {opacity: hover ? opacity : 0},
      ]}
    />
  )

  if (IS_WEB && web) {
    return isTouchDevice ? null : el
  } else if (IS_NATIVE && native) {
    return el
  }

  return null
}
