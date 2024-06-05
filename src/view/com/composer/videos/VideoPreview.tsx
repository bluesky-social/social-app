import React from 'react'
import * as FileSystem from 'expo-file-system'

import {Text} from '#/components/Typography'

export function VideoPreview({video}: {video: FileSystem.FileInfo}) {
  return <Text>{JSON.stringify(video, null, 2)}</Text>
}
