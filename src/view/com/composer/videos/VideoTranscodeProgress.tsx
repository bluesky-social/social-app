import React from 'react'
import {View} from 'react-native'
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie'
import {ImagePickerAsset} from 'expo-image-picker'

import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {VideoTranscodeBackdrop} from './VideoTranscodeBackdrop'

export function VideoTranscodeProgress({
  input,
  progress,
}: {
  input: ImagePickerAsset
  progress: number
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.mt_md,
        t.atoms.bg_contrast_50,
        a.rounded_md,
        a.overflow_hidden,
        {aspectRatio: Math.max(input.width / input.height, 16 / 9)},
      ]}>
      <VideoTranscodeBackdrop uri={input.uri} />
      <View
        style={[
          a.flex_1,
          a.align_center,
          a.justify_center,
          a.gap_lg,
          a.absolute,
          a.inset_0,
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
        <Text>Compressing...</Text>
      </View>
    </View>
  )
}
