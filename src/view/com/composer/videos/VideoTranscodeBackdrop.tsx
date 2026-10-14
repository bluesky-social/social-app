import Animated, {FadeIn} from 'react-native-reanimated'
import {File} from 'expo-file-system'
import {Image} from 'expo-image'
import {
  getThumbnailAsync,
  type VideoThumbnailsResult,
} from 'expo-video-thumbnails'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {atoms as a} from '#/alf'

export const RQKEY = 'video-thumbnail'

export function clearThumbnailCache(queryClient: QueryClient) {
  for (const [, thumbnail] of queryClient.getQueriesData<VideoThumbnailsResult>(
    {queryKey: [RQKEY]},
  )) {
    if (thumbnail) {
      deleteThumbnail(thumbnail)
    }
  }
  queryClient.removeQueries({queryKey: [RQKEY]})
}

function deleteThumbnail(thumbnail: VideoThumbnailsResult) {
  try {
    new File(thumbnail.uri).delete()
  } catch {}
}

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  const {data: thumbnail} = useQuery({
    queryKey: [RQKEY, uri],
    queryFn: async ({signal}) => {
      const result = await getThumbnailAsync(uri)
      if (signal.aborted) {
        deleteThumbnail(result)
        throw new Error('Thumbnail generation canceled')
      }
      return result
    },
  })

  return (
    thumbnail && (
      <Animated.View style={a.flex_1} entering={FadeIn}>
        <Image
          style={a.flex_1}
          source={thumbnail.uri}
          cachePolicy="none"
          accessibilityIgnoresInvertColors
          blurRadius={15}
          contentFit="cover"
        />
      </Animated.View>
    )
  )
}
