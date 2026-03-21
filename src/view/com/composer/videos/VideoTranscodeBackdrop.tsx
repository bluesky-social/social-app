import Animated, {FadeIn} from 'react-native-reanimated'
import {Image} from 'expo-image'
import * as VideoThumbnails from 'expo-video-thumbnails'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {atoms as a} from '#/alf'

export const RQKEY = 'video-thumbnail'

export function clearThumbnailCache(queryClient: QueryClient) {
  void queryClient.resetQueries({queryKey: [RQKEY]})
}

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  const {data: thumbnail} = useQuery({
    queryKey: [RQKEY, uri],
    queryFn: async () => {
      const result = await VideoThumbnails.getThumbnailAsync(uri)
      return result.uri
    },
  })

  return (
    thumbnail && (
      <Animated.View style={a.flex_1} entering={FadeIn}>
        <Image
          style={a.flex_1}
          source={thumbnail}
          cachePolicy="none"
          accessibilityIgnoresInvertColors
          blurRadius={15}
          contentFit="cover"
        />
      </Animated.View>
    )
  )
}
