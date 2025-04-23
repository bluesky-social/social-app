import {View} from 'react-native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {FABInner, FABProps} from './FABInner'

export const FAB = (_opts: FABProps) => {
  const {isDesktop} = useWebMediaQueries()

  if (!isDesktop) {
    return <FABInner {..._opts} />
  }

  return <View />
}
