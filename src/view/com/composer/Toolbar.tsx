import React from 'react'
import {View} from 'react-native'
// @ts-ignore no type definition -prf
import ProgressCircle from 'react-native-progress/Circle'

import {State} from 'state/queries/video/upload-video'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function VideoUploadToolbar({state}: {state: State}) {
  const t = useTheme()

  const progress =
    state.status === 'compressing'
      ? state.progress
      : state.jobStatus?.progress ?? 100

  return (
    <View style={[a.gap_sm, a.flex_row, a.align_center]}>
      <ProgressCircle
        size={30}
        borderWidth={1}
        borderColor={t.atoms.border_contrast_low.borderColor}
        color={t.palette.primary_500}
        progress={progress}
      />
      <Text>{state.status}</Text>
    </View>
  )
}
