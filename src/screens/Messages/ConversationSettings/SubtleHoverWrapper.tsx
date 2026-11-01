import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {SubtleHover} from '#/components/SubtleHover'

export function SubtleHoverWrapper({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <View style={a.pointer}>
      <SubtleHover />
      {children}
    </View>
  )
}
