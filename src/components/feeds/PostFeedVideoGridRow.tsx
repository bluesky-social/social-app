import {View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'

import {FeedPostSliceItem} from '#/state/queries/post-feed'
import {atoms as a, useGutters} from '#/alf'
import {
  SourceContext,
  VideoPostCard,
  VideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

export function PostFeedVideoGridRow({
  slices,
  sourceContext,
}: {
  slices: FeedPostSliceItem[]
  sourceContext: SourceContext
}) {
  const gutters = useGutters(['base', 'base', 0, 'base'])
  const posts = slices
    .filter(slice => AppBskyEmbedVideo.isView(slice.post.embed))
    .map(slice => slice.post)

  /**
   * This should not happen because we should be filtering out posts without
   * videos within the `PostFeed` component.
   */
  if (posts.length !== slices.length) return null

  return (
    <View style={[gutters]}>
      <View style={[a.flex_row, a.gap_sm]}>
        {posts.map(post => (
          <View key={post.uri} style={[a.flex_1]}>
            <VideoPostCard post={post} sourceContext={sourceContext} />
          </View>
        ))}
      </View>
    </View>
  )
}

export function PostFeedVideoGridRowPlaceholder() {
  const gutters = useGutters(['base', 'base', 0, 'base'])
  return (
    <View style={[gutters]}>
      <View style={[a.flex_row, a.gap_sm]}>
        <VideoPostCardPlaceholder />
        <VideoPostCardPlaceholder />
      </View>
    </View>
  )
}
