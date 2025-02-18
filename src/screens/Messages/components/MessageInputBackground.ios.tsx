import {View} from 'react-native'
import {BlurView} from 'expo-blur'

import {atoms as a, useTheme, ViewStyleProp} from '#/alf'

export function MessageInputBackground({
  style,
  children,
}: React.PropsWithChildren<ViewStyleProp>) {
  const t = useTheme()
  return (
    <BlurView style={[a.relative, style]} tint={t.scheme} intensity={100}>
      <View
        style={[
          a.absolute,
          a.inset_0,
          t.atoms.bg,
          a.pointer_events_none,
          {opacity: 0.8},
        ]}
      />
      {children}
    </BlurView>
  )
}
