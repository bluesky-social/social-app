import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'

export function PlayButtonIcon({size = 44}: {size?: number}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_full,
        a.align_center,
        a.justify_center,
        {
          backgroundColor: t.palette.primary_500,
          width: size + 16,
          height: size + 16,
        },
      ]}>
      <PlayIcon height={size} width={size} style={{color: 'white'}} />
    </View>
  )
}
