import React from 'react'
import Animated, {FadeIn} from 'react-native-reanimated'
import * as FileSystem from 'expo-file-system'
import {Image} from 'expo-image'
import {useQuery} from '@tanstack/react-query'
import {FFmpegKit} from 'ffmpeg-kit-react-native'

import {atoms as a} from '#/alf'

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  const {data: thumbnail} = useQuery({
    queryKey: ['thumbnail', uri],
    queryFn: async () => {
      const thumbnailJpg = `${FileSystem.cacheDirectory}/thumbnail.jpg`
      if ((await FileSystem.getInfoAsync(thumbnailJpg)).exists) {
        await FileSystem.deleteAsync(thumbnailJpg)
      }
      await FFmpegKit.execute(
        `-ss 00:00:01.000 -i ${uri} -vf 'scale=320:320:force_original_aspect_ratio=decrease' -frames:v 1 ${thumbnailJpg}`,
      )
      return thumbnailJpg
    },
  })

  return (
    <Animated.View style={a.flex_1} entering={FadeIn}>
      {thumbnail && (
        <Image
          style={a.flex_1}
          source={thumbnail}
          cachePolicy="none"
          accessibilityIgnoresInvertColors
          blurRadius={15}
          contentFit="cover"
        />
      )}
    </Animated.View>
  )
}
