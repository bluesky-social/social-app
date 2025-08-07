import {
  type $Typed,
  AppGndrEmbedExternal,
  AppGndrEmbedImages,
  AppGndrEmbedRecord,
  AppGndrEmbedRecordWithMedia,
  AppGndrEmbedVideo,
  AppGndrFeedDefs,
  AppGndrGraphDefs,
  AppGndrLabelerDefs,
} from '@gander-social-atproto/api'

export type Embed =
  | {
      type: 'post'
      view: $Typed<AppGndrEmbedRecord.ViewRecord>
    }
  | {
      type: 'post_not_found'
      view: $Typed<AppGndrEmbedRecord.ViewNotFound>
    }
  | {
      type: 'post_blocked'
      view: $Typed<AppGndrEmbedRecord.ViewBlocked>
    }
  | {
      type: 'post_detached'
      view: $Typed<AppGndrEmbedRecord.ViewDetached>
    }
  | {
      type: 'feed'
      view: $Typed<AppGndrFeedDefs.GeneratorView>
    }
  | {
      type: 'list'
      view: $Typed<AppGndrGraphDefs.ListView>
    }
  | {
      type: 'labeler'
      view: $Typed<AppGndrLabelerDefs.LabelerView>
    }
  | {
      type: 'starter_pack'
      view: $Typed<AppGndrGraphDefs.StarterPackViewBasic>
    }
  | {
      type: 'images'
      view: $Typed<AppGndrEmbedImages.View>
    }
  | {
      type: 'link'
      view: $Typed<AppGndrEmbedExternal.View>
    }
  | {
      type: 'video'
      view: $Typed<AppGndrEmbedVideo.View>
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

export function parseEmbedRecordView({record}: AppGndrEmbedRecord.View): Embed {
  if (AppGndrEmbedRecord.isViewRecord(record)) {
    return {
      type: 'post',
      view: record,
    }
  } else if (AppGndrEmbedRecord.isViewNotFound(record)) {
    return {
      type: 'post_not_found',
      view: record,
    }
  } else if (AppGndrEmbedRecord.isViewBlocked(record)) {
    return {
      type: 'post_blocked',
      view: record,
    }
  } else if (AppGndrEmbedRecord.isViewDetached(record)) {
    return {
      type: 'post_detached',
      view: record,
    }
  } else if (AppGndrFeedDefs.isGeneratorView(record)) {
    return {
      type: 'feed',
      view: record,
    }
  } else if (AppGndrGraphDefs.isListView(record)) {
    return {
      type: 'list',
      view: record,
    }
  } else if (AppGndrLabelerDefs.isLabelerView(record)) {
    return {
      type: 'labeler',
      view: record,
    }
  } else if (AppGndrGraphDefs.isStarterPackViewBasic(record)) {
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

export function parseEmbed(embed: AppGndrFeedDefs.PostView['embed']): Embed {
  if (AppGndrEmbedImages.isView(embed)) {
    return {
      type: 'images',
      view: embed,
    }
  } else if (AppGndrEmbedExternal.isView(embed)) {
    return {
      type: 'link',
      view: embed,
    }
  } else if (AppGndrEmbedVideo.isView(embed)) {
    return {
      type: 'video',
      view: embed,
    }
  } else if (AppGndrEmbedRecord.isView(embed)) {
    return parseEmbedRecordView(embed)
  } else if (AppGndrEmbedRecordWithMedia.isView(embed)) {
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
