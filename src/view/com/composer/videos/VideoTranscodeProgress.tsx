import {View} from 'react-native'
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie'
import {type ImagePickerAsset} from 'expo-image-picker'

import {clamp} from '#/lib/numbers'
import {atoms as a, useTheme} from '#/alf'
import {IS_WEB} from '#/env'
import {ExternalEmbedRemoveBtn} from '../ExternalEmbedRemoveBtn'
import {VideoTranscodeBackdrop} from './VideoTranscodeBackdrop'

export function VideoTranscodeProgress({
  asset,
  progress,
  clear,
}: {
  asset: ImagePickerAsset
  progress: number
  clear: () => void
}) {
  const t = useTheme()

  if (IS_WEB) return null

  let aspectRatio = asset.width / asset.height

  if (isNaN(aspectRatio)) {
    aspectRatio = 16 / 9
  }

  aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1)

  return (
    <View
      style={[
        a.w_full,
        t.atoms.bg_contrast_50,
        a.rounded_md,
        a.overflow_hidden,
        {aspectRatio},
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
          size={48}
          borderWidth={3}
          borderColor={t.atoms.text.color}
          color={t.atoms.text.color}
          progress={progress}
        />
      </View>
      <ExternalEmbedRemoveBtn onRemove={clear} />
    </View>
  )
}
