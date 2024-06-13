import React from 'react'
import Animated, {FadeIn} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {useQuery} from '@tanstack/react-query'

import {atoms as a} from '#/alf'

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  const {data: thumbnail} = useQuery({
    queryKey: ['thumbnail', uri],
    queryFn: async () => {
      throw new Error('Not implemented')
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
