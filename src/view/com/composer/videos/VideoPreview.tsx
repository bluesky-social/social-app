import React from 'react'
import * as FileSystem from 'expo-file-system'

import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function VideoPreview({
  video,
  clear,
}: {
  video: FileSystem.FileInfo
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
