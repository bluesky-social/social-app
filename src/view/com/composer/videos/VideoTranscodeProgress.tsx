import React from 'react'
import {View} from 'react-native'
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie'
import {ImagePickerAsset} from 'expo-image-picker'

import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function VideoTranscodeProgress({
  input,
  progress,
}: {
  input: ImagePickerAsset
  progress: number
}) {
  const t = useTheme()

  return (
    <View style={a.mt_md}>
      <View
        style={[
          a.flex_1,
          t.atoms.bg_contrast_50,
          a.rounded_md,
          a.align_center,
          a.justify_center,
          a.gap_lg,
          {aspectRatio: Math.max(input.width / input.height, 16 / 9)},
        ]}>
        {input.duration ? (
          <ProgressPie
            size={64}
            borderWidth={4}
            borderColor={t.atoms.text.color}
            color={t.atoms.text.color}
            progress={progress}
          />
        ) : (
          <Loader size="xl" />
        )}
        <Text>Transcoding...</Text>
      </View>
    </View>
  )
}
