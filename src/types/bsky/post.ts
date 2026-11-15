import {type $Typed} from '@atproto/lex'

import {app} from '#/lexicons'
import {isType} from '#/types/bsky'

export type Embed =
  | {
      type: 'post'
      view: $Typed<app.bsky.embed.record.ViewRecord>
    }
  | {
      type: 'post_not_found'
      view: $Typed<app.bsky.embed.record.ViewNotFound>
    }
  | {
      type: 'post_blocked'
      view: $Typed<app.bsky.embed.record.ViewBlocked>
    }
  | {
      type: 'post_detached'
      view: $Typed<app.bsky.embed.record.ViewDetached>
    }
  | {
      type: 'feed'
      view: $Typed<app.bsky.feed.defs.GeneratorView>
    }
  | {
      type: 'list'
      view: $Typed<app.bsky.graph.defs.ListView>
    }
  | {
      type: 'labeler'
      view: $Typed<app.bsky.labeler.defs.LabelerView>
    }
  | {
      type: 'starter_pack'
      view: $Typed<app.bsky.graph.defs.StarterPackViewBasic>
    }
  | {
      type: 'images'
      view: $Typed<app.bsky.embed.images.View>
    }
  | {
      type: 'gallery'
      view: $Typed<app.bsky.embed.gallery.View>
    }
  | {
      type: 'link'
      view: $Typed<app.bsky.embed.external.View>
    }
  | {
      type: 'video'
      view: $Typed<app.bsky.embed.video.View>
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

export function parseEmbedRecordView({
  record,
}: app.bsky.embed.record.View): Embed {
  if (isType(app.bsky.embed.record.viewRecord, record)) {
    return {
      type: 'post',
      view: record,
    }
  } else if (isType(app.bsky.embed.record.viewNotFound, record)) {
    return {
      type: 'post_not_found',
      view: record,
    }
  } else if (isType(app.bsky.embed.record.viewBlocked, record)) {
    return {
      type: 'post_blocked',
      view: record,
    }
  } else if (isType(app.bsky.embed.record.viewDetached, record)) {
    return {
      type: 'post_detached',
      view: record,
    }
  } else if (isType(app.bsky.feed.defs.generatorView, record)) {
    return {
      type: 'feed',
      view: record,
    }
  } else if (isType(app.bsky.graph.defs.listView, record)) {
    return {
      type: 'list',
      view: record,
    }
  } else if (isType(app.bsky.labeler.defs.labelerView, record)) {
    return {
      type: 'labeler',
      view: record,
    }
  } else if (isType(app.bsky.graph.defs.starterPackViewBasic, record)) {
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

export function parseEmbed(embed: app.bsky.feed.defs.PostView['embed']): Embed {
  if (isType(app.bsky.embed.images.view, embed)) {
    return {
      type: 'images',
      view: embed,
    }
  } else if (isType(app.bsky.embed.gallery.view, embed)) {
    return {
      type: 'gallery',
      view: embed,
    }
  } else if (isType(app.bsky.embed.external.view, embed)) {
    return {
      type: 'link',
      view: embed,
    }
  } else if (isType(app.bsky.embed.video.view, embed)) {
    return {
      type: 'video',
      view: embed,
    }
  } else if (isType(app.bsky.embed.record.view, embed)) {
    return parseEmbedRecordView(embed)
  } else if (isType(app.bsky.embed.recordWithMedia.view, embed)) {
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
