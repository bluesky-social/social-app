import {type $Typed} from '@atproto/lex'

import * as AppBskyEmbedExternal from '#/lexicons/app/bsky/embed/external'
import * as AppBskyEmbedGallery from '#/lexicons/app/bsky/embed/gallery'
import * as AppBskyEmbedImages from '#/lexicons/app/bsky/embed/images'
import * as AppBskyEmbedRecord from '#/lexicons/app/bsky/embed/record'
import * as AppBskyEmbedRecordWithMedia from '#/lexicons/app/bsky/embed/recordWithMedia'
import * as AppBskyEmbedVideo from '#/lexicons/app/bsky/embed/video'
import * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyGraphDefs from '#/lexicons/app/bsky/graph/defs'
import * as AppBskyLabelerDefs from '#/lexicons/app/bsky/labeler/defs'
import {isType} from '#/types/bsky'

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
      type: 'gallery'
      view: $Typed<AppBskyEmbedGallery.View>
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
  if (isType(AppBskyEmbedRecord.viewRecord, record)) {
    return {
      type: 'post',
      view: record,
    }
  } else if (isType(AppBskyEmbedRecord.viewNotFound, record)) {
    return {
      type: 'post_not_found',
      view: record,
    }
  } else if (isType(AppBskyEmbedRecord.viewBlocked, record)) {
    return {
      type: 'post_blocked',
      view: record,
    }
  } else if (isType(AppBskyEmbedRecord.viewDetached, record)) {
    return {
      type: 'post_detached',
      view: record,
    }
  } else if (isType(AppBskyFeedDefs.generatorView, record)) {
    return {
      type: 'feed',
      view: record,
    }
  } else if (isType(AppBskyGraphDefs.listView, record)) {
    return {
      type: 'list',
      view: record,
    }
  } else if (isType(AppBskyLabelerDefs.labelerView, record)) {
    return {
      type: 'labeler',
      view: record,
    }
  } else if (isType(AppBskyGraphDefs.starterPackViewBasic, record)) {
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
  if (isType(AppBskyEmbedImages.view, embed)) {
    return {
      type: 'images',
      view: embed,
    }
  } else if (isType(AppBskyEmbedGallery.view, embed)) {
    return {
      type: 'gallery',
      view: embed,
    }
  } else if (isType(AppBskyEmbedExternal.view, embed)) {
    return {
      type: 'link',
      view: embed,
    }
  } else if (isType(AppBskyEmbedVideo.view, embed)) {
    return {
      type: 'video',
      view: embed,
    }
  } else if (isType(AppBskyEmbedRecord.view, embed)) {
    return parseEmbedRecordView(embed)
  } else if (isType(AppBskyEmbedRecordWithMedia.view, embed)) {
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
