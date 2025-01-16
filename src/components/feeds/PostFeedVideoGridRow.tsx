import {View} from 'react-native'

import {FeedPostSliceItem} from '#/state/queries/post-feed'
import {atoms as a, useGutters} from '#/alf'
import {VideoPostCard} from '#/components/VideoPostCard'

export function PostFeedVideoGridRow({posts}: {posts: FeedPostSliceItem[]}) {
  const gutters = useGutters(['base', 'base', 0, 'base'])
  return (
    <View style={[gutters]}>
      <View style={[a.flex_row, a.gap_lg]}>
        {posts.map(post => (
          <View key={post._reactKey} style={[a.flex_1]}>
            <VideoPostCard post={post} />
          </View>
        ))}
      </View>
    </View>
  )
}
