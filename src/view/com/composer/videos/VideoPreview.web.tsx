import React from 'react'
import {View} from 'react-native'

import {CompressedVideo} from '#/lib/media/video/compress'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

export function VideoPreview({
  video,
  clear,
}: {
  video: CompressedVideo
  clear: () => void
}) {
  return (
    <>
      <View
        style={[
          a.w_full,
          a.rounded_sm,
          {aspectRatio: 16 / 9},
          a.overflow_hidden,
        ]}>
        <video
          src={video.uri}
          style={a.flex_1}
          autoPlay
          loop
          muted
          playsInline
        />
      </View>

      <View style={[a.flex_row, a.mt_sm, a.gap_sm]}>
        <Button
          onPress={clear}
          label="Clear"
          size="small"
          color="primary"
          variant="solid">
          <ButtonText>Clear</ButtonText>
        </Button>
      </View>
    </>
  )
}
