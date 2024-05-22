import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'

// Wanted make use of web's `inert` attribute as it disables *both* pointer and
// keyboard interactions. Does an equivalent exist for native?

export const InertContents = ({
  inert,
  children,
}: {
  inert?: boolean
  children: React.ReactNode
}): React.ReactNode => {
  if (inert) {
    return <View style={a.pointer_events_none}>{children}</View>
  }

  return children
}
