import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function StarterPackCard({hideTopBorder}: {hideTopBorder?: boolean}) {
  const t = useTheme()

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <Text>Hello!</Text>
    </View>
  )
}
