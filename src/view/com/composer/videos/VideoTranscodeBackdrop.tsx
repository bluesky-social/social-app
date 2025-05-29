import {clearCache, createVideoThumbnail} from 'react-native-compressor'
import Animated, {FadeIn} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {atoms as a} from '#/alf'

export const RQKEY = 'video-thumbnail'

export function clearThumbnailCache(queryClient: QueryClient) {
  clearCache().catch(() => {})
  queryClient.resetQueries({queryKey: [RQKEY]})
}

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  const {data: thumbnail} = useQuery({
    queryKey: [RQKEY, uri],
    queryFn: async () => {
      return await createVideoThumbnail(uri)
    },
  })

  return (
    thumbnail && (
      <Animated.View style={a.flex_1} entering={FadeIn}>
        <Image
          style={a.flex_1}
          source={thumbnail.path}
          cachePolicy="none"
          accessibilityIgnoresInvertColors
          blurRadius={15}
          contentFit="cover"
        />
      </Animated.View>
    )
  )
}
