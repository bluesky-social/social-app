import React from 'react'
import {View} from 'react-native'
import {FABInner, FABProps} from './FABInner'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export const FAB = (_opts: FABProps) => {
  const {isDesktop} = useWebMediaQueries()

  if (!isDesktop) {
    return <FABInner {..._opts} />
  }

  return <View />
}
