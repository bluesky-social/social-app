import {View} from 'react-native'

import {useTheme, ViewStyleProp} from '#/alf'

export function MessageInputBackground({
  style,
  children,
}: React.PropsWithChildren<ViewStyleProp>) {
  const t = useTheme()
  return <View style={[t.atoms.bg, style]}>{children}</View>
}
