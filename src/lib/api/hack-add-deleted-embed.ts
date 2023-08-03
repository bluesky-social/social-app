import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  ComAtprotoRepoStrongRef,
} from '@atproto/api'

/**
 * HACK
 * The server doesnt seem to be correctly giving the notFound view yet
 * so I'm adding it manually for now
 * -prf
 */
export function hackAddDeletedEmbed(post: AppBskyFeedDefs.PostView) {
  const record = post.record as AppBskyFeedPost.Record
  if (record.embed?.$type === 'app.bsky.embed.record' && !post.embed) {
    post.embed = {
      $type: 'app.bsky.embed.record#view',
      record: {
        $type: 'app.bsky.embed.record#viewNotFound',
        uri: (record.embed.record as ComAtprotoRepoStrongRef.Main).uri,
      },
    }
  }
}
