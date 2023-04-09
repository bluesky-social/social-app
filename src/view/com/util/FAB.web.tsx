import React from 'react'
import {View} from 'react-native'
import * as Mobile from './FABMobile'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export const FAB = (_opts: Mobile.FABProps) => {
  const {isDesktop} = useWebMediaQueries()

  if (!isDesktop) {
    return <Mobile.FAB {..._opts} />
  }

  return <View />
}
