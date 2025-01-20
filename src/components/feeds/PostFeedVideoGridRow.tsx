import {View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'

import {logEvent} from '#/lib/statsig/statsig'
import {FeedPostSliceItem} from '#/state/queries/post-feed'
import {VideoFeedSourceContext} from '#/screens/VideoFeed/types'
import {atoms as a, useGutters} from '#/alf'
import * as Grid from '#/components/Grid'
import {
  VideoPostCard,
  VideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

export function PostFeedVideoGridRow({
  items: slices,
  sourceContext,
}: {
  items: FeedPostSliceItem[]
  sourceContext: VideoFeedSourceContext
}) {
  const gutters = useGutters(['base', 'base', 0, 'base'])
  const posts = slices
    .filter(slice => AppBskyEmbedVideo.isView(slice.post.embed))
    .map(slice => ({
      post: slice.post,
      moderation: slice.moderation,
    }))

  /**
   * This should not happen because we should be filtering out posts without
   * videos within the `PostFeed` component.
   */
  if (posts.length !== slices.length) return null

  return (
    <View style={[gutters]}>
      <View style={[a.flex_row, a.gap_sm]}>
        <Grid.Row gap={a.gap_sm.gap}>
          {posts.map(post => (
            <Grid.Col key={post.post.uri} width={1 / 2}>
              <VideoPostCard
                post={post.post}
                sourceContext={sourceContext}
                moderation={post.moderation}
                onInteract={() => {
                  logEvent('videoCard:click', {context: 'feed'})
                }}
              />
            </Grid.Col>
          ))}
        </Grid.Row>
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
