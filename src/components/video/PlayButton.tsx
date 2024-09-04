import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'

export function PlayButton({size = 48}: {size?: number}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_full,
        a.align_center,
        a.justify_center,
        {
          backgroundColor: t.palette.primary_500,
          width: size + 12,
          height: size + 12,
        },
      ]}>
      <PlayIcon height={size} width={size} color="white" />
    </View>
  )
}
