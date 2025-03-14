import {
  $Typed,
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
      view: $Typed<AppBskyEmbedRecord.ViewRecord>
    }
  | {
      type: 'post_not_found'
      view: $Typed<AppBskyEmbedRecord.ViewNotFound>
    }
  | {
      type: 'post_blocked'
      view: $Typed<AppBskyEmbedRecord.ViewBlocked>
    }
  | {
      type: 'post_detached'
      view: $Typed<AppBskyEmbedRecord.ViewDetached>
    }
  | {
      type: 'feed'
      view: $Typed<AppBskyFeedDefs.GeneratorView>
    }
  | {
      type: 'list'
      view: $Typed<AppBskyGraphDefs.ListView>
    }
  | {
      type: 'labeler'
      view: $Typed<AppBskyLabelerDefs.LabelerView>
    }
  | {
      type: 'starter_pack'
      view: $Typed<AppBskyGraphDefs.StarterPackViewBasic>
    }
  | {
      type: 'images'
      view: $Typed<AppBskyEmbedImages.View>
    }
  | {
      type: 'link'
      view: $Typed<AppBskyEmbedExternal.View>
    }
  | {
      type: 'video'
      view: $Typed<AppBskyEmbedVideo.View>
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
