import {View} from 'react-native'

import {isAndroidWeb} from '#/lib/browser'
import {atoms as a, useTheme} from '#/alf'

/**
 * GlassyBackdrop component
 * On web, it applies a backdrop filter to create a glassy effect.
 * On native and non-safari mobile web, it's just a solid color.
 */
export function GlassyBackdrop() {
  const t = useTheme()

  if (isAndroidWeb) {
    return <View style={[a.absolute, a.inset_0, t.atoms.bg]} />
  }

  return (
    <>
      <View
        style={[
          a.absolute,
          a.inset_0,
          t.atoms.bg,
          a.pointer_events_none,
          {opacity: 0.9},
        ]}
      />
      <View
        style={[
          a.absolute,
          a.inset_0,
          a.pointer_events_none,
          {backdropFilter: 'blur(16px)'},
        ]}
      />
    </>
  )
}
