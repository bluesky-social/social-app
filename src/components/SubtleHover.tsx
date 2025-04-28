import {View} from 'react-native'

import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'

export function SubtleHover({style, hover}: ViewStyleProp & {hover: boolean}) {
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

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.pointer_events_none,
        a.transition_opacity,
        t.atoms.bg_contrast_25,
        style,
        {opacity: hover ? opacity : 0},
      ]}
    />
  )
}
