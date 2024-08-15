import React from 'react'
import {View} from 'react-native'
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie'
import {ImagePickerAsset} from 'expo-image-picker'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {VideoTranscodeBackdrop} from './VideoTranscodeBackdrop'

export function VideoTranscodeProgress({
  asset,
  progress,
}: {
  asset: ImagePickerAsset
  progress: number
}) {
  const t = useTheme()

  const aspectRatio = asset.width / asset.height

  return (
    <View
      style={[
        a.w_full,
        a.mt_md,
        t.atoms.bg_contrast_50,
        a.rounded_md,
        a.overflow_hidden,
        {aspectRatio: isNaN(aspectRatio) ? 16 / 9 : aspectRatio},
      ]}>
      <VideoTranscodeBackdrop uri={asset.uri} />
      <View
        style={[
          a.flex_1,
          a.align_center,
          a.justify_center,
          a.gap_lg,
          a.absolute,
          a.inset_0,
        ]}>
        <ProgressPie
          size={64}
          borderWidth={4}
          borderColor={t.atoms.text.color}
          color={t.atoms.text.color}
          progress={progress}
        />
        <Text>
          <Trans>Compressing...</Trans>
        </Text>
      </View>
    </View>
  )
}
