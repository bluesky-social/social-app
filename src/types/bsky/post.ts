import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyLabelerDefs,
} from '@atproto/api'

export type Embed =
  | {
      type: 'post'
      view: AppBskyEmbedRecord.ViewRecord
    }
  | {
      type: 'post_not_found'
      view: AppBskyEmbedRecord.ViewNotFound
    }
  | {
      type: 'post_blocked'
      view: AppBskyEmbedRecord.ViewBlocked
    }
  | {
      type: 'post_detached'
      view: AppBskyEmbedRecord.ViewDetached
    }
  | {
      type: 'feed'
      view: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'list'
      view: AppBskyGraphDefs.ListView
    }
  | {
      type: 'labeler'
      view: AppBskyLabelerDefs.LabelerView
    }
  | {
      type: 'starter_pack'
      view: AppBskyGraphDefs.StarterPackViewBasic
    }
  | {
      type: 'images'
      view: AppBskyEmbedImages.View
    }
  | {
      type: 'link'
      view: AppBskyEmbedExternal.View
    }
  | {
      type: 'video'
      view: AppBskyEmbedVideo.View
    }
  | {
      type: 'post_with_media'
      view: Embed
      media: Embed
    }
  | {
      type: 'unknown'
      view: null
    }

export type EmbedType<T extends Embed['type']> = Extract<Embed, {type: T}>

export function parseEmbedRecordView({record}: AppBskyEmbedRecord.View): Embed {
  if (AppBskyEmbedRecord.isViewRecord(record)) {
    return {
      type: 'post',
      view: record,
    }
  } else if (AppBskyEmbedRecord.isViewNotFound(record)) {
    return {
      type: 'post_not_found',
      view: record,
    }
  } else if (AppBskyEmbedRecord.isViewBlocked(record)) {
    return {
      type: 'post_blocked',
      view: record,
    }
  } else if (AppBskyEmbedRecord.isViewDetached(record)) {
    return {
      type: 'post_detached',
      view: record,
    }
  } else if (AppBskyFeedDefs.isGeneratorView(record)) {
    return {
      type: 'feed',
      view: record,
    }
  } else if (AppBskyGraphDefs.isListView(record)) {
    return {
      type: 'list',
      view: record,
    }
  } else if (AppBskyLabelerDefs.isLabelerView(record)) {
    return {
      type: 'labeler',
      view: record,
    }
  } else if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
    return {
      type: 'starter_pack',
      view: record,
    }
  } else {
    return {
      type: 'unknown',
      view: null,
    }
  }
}

export function parseEmbed(embed: AppBskyFeedDefs.PostView['embed']): Embed {
  if (AppBskyEmbedImages.isView(embed)) {
    return {
      type: 'images',
      view: embed,
    }
  } else if (AppBskyEmbedExternal.isView(embed)) {
    return {
      type: 'link',
      view: embed,
    }
  } else if (AppBskyEmbedVideo.isView(embed)) {
    return {
      type: 'video',
      view: embed,
    }
  } else if (AppBskyEmbedRecord.isView(embed)) {
    return parseEmbedRecordView(embed)
  } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return {
      type: 'post_with_media',
      view: parseEmbedRecordView(embed.record),
      media: parseEmbed(embed.media),
    }
  } else {
    return {
      type: 'unknown',
      view: null,
    }
  }
}
