import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {SubtleHover} from '#/components/SubtleHover'

export function SubtleHoverWrapper({
  children,
}: React.PropsWithChildren<unknown>) {
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  return (
    <View
      // Web-only
      onPointerEnter={onHoverIn}
      // Web-only
      onPointerLeave={onHoverOut}
      style={a.pointer}>
      <SubtleHover hover={hover} />
      {children}
    </View>
  )
}
