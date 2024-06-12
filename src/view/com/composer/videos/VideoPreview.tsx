import React from 'react'

import {CompressedVideo} from '#/lib/media/video/compress'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function VideoPreview({
  video,
  clear,
}: {
  video: CompressedVideo
  clear: () => void
}) {
  return (
    <>
      <Text>{JSON.stringify(video, null, 2)}</Text>
      <Button
        onPress={clear}
        label="Clear"
        size="small"
        color="primary"
        variant="solid">
        <ButtonText>Clear</ButtonText>
      </Button>
    </>
  )
}
