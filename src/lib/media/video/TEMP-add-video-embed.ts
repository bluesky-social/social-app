import {
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from '@atproto/api'
import {AppBskyEmbedVideo} from '@atproto/api-prerelease'

/**
 * Parses the post's record to see if there's a video in there
 * Needed because the AppView doesn't add video embed views yet
 *
 * REMOVE WHEN APPVIEW ADDS VIDEO EMBED VIEWS
 */
export function TEMP_addVideoEmbed(
  post: AppBskyFeedDefs.PostView,
  record: AppBskyFeedPost.Record,
  enabled: boolean,
): AppBskyFeedDefs.PostView {
  if (enabled && process.env.EXPO_PUBLIC_VIDEO_ROOT_ENDPOINT) {
    if (AppBskyEmbedVideo.isMain(record.embed)) {
      return {
        ...post,
        embed: generateEmbed(post, record.embed),
      }
    } else if (
      AppBskyEmbedRecordWithMedia.isMain(record.embed) &&
      AppBskyEmbedVideo.isMain(record.embed.media)
    ) {
      return {
        ...post,
        embed: {
          ...post.embed,
          media: generateEmbed(post, record.embed.media),
        } as AppBskyEmbedRecordWithMedia.View,
      }
    }
  }

  return post
}

function generateEmbed(
  post: AppBskyFeedDefs.PostView,
  embed: AppBskyEmbedVideo.Main,
) {
  return {
    $type: 'app.bsky.embed.video#view',
    aspectRatio: embed.aspectRatio,
    alt: embed.alt,
    cid: embed.video.ref.toString(),
    playlist: `${process.env.EXPO_PUBLIC_VIDEO_ROOT_ENDPOINT}watch/${
      post.author.did
    }/${embed.video.ref.toString()}/playlist.m3u8`,
  } satisfies AppBskyEmbedVideo.View
}
