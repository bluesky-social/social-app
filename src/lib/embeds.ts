import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
} from '@atproto/api'

export function isEmbedByEmbedder(
  embed: AppBskyFeedDefs.PostView['embed'],
  did: string,
): boolean {
  if (!embed) {
    return false
  }
  if (AppBskyEmbedRecord.isViewRecord(embed.record)) {
    return embed.record.author.did === did
  }
  if (
    AppBskyEmbedRecordWithMedia.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record.record)
  ) {
    return embed.record.record.author.did === did
  }
  return true
}

export function isVideoView(
  v: unknown,
): v is
  | AppBskyEmbedVideo.View
  | (AppBskyEmbedRecordWithMedia.View & {media: AppBskyEmbedVideo.View}) {
  return (
    AppBskyEmbedVideo.isView(v) ||
    (AppBskyEmbedRecordWithMedia.isView(v) && AppBskyEmbedVideo.isView(v.media))
  )
}

export function getVideoEmbed(v: unknown): AppBskyEmbedVideo.View | null {
  if (AppBskyEmbedVideo.isView(v)) {
    return v
  }
  if (
    AppBskyEmbedRecordWithMedia.isView(v) &&
    AppBskyEmbedVideo.isView(v.media)
  ) {
    return v.media
  }
  return null
}
