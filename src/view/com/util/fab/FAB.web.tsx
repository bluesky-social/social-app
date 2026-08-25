import {View} from 'react-native'

import {useBreakpoints} from '#/alf'
import {FABInner, type FABProps} from './FABInner'

export const FAB = (props: FABProps) => {
  const {gtMobile} = useBreakpoints()

  if (!gtMobile) {
    return <FABInner {...props} />
  }

  return <View />
}
