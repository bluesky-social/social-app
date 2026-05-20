import {View} from 'react-native'
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie'
import {type ImagePickerAsset} from 'expo-image-picker'

import {atoms as a, useTheme} from '#/alf'
import {ConstrainedImage} from '#/components/images/AutoSizedImage'
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

  let aspectRatio: number | undefined
  if (asset.width && asset.height) {
    const raw = asset.width / asset.height
    if (!Number.isNaN(raw)) {
      aspectRatio = raw
    }
  }

  let constrained: number | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
  }

  return (
    <View style={[a.pt_xs]}>
      <ConstrainedImage
        aspectRatio={constrained || 1}
        minMobileAspectRatio={14 / 9}>
        <View
          style={[
            a.flex_1,
            t.atoms.bg_contrast_50,
            a.rounded_md,
            a.overflow_hidden,
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
      </ConstrainedImage>
    </View>
  )
}
