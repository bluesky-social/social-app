import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
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
