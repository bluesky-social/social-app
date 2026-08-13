import {
  type $Typed as $TypedApi,
  type AppBskyEmbedExternal,
  type AppBskyEmbedGallery,
  type AppBskyEmbedImages,
  type AppBskyEmbedRecord,
  type AppBskyEmbedVideo,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type AppBskyLabelerDefs,
} from '@atproto/api'
import {type $Typed} from '@atproto/lex'

import {app} from '#/lexicons'
import {isType} from '#/types/bsky'

/*
 * Each `view` slot below accepts both the generated `#/lexicons` view and the
 * `@atproto/api` view of the same def, because both worlds have live producers:
 * `parseEmbed` narrows with the `#/lexicons` schemas and so returns new-world
 * views, while call sites that build an `Embed` by hand still pass views
 * produced through the `@atproto/api` agent.
 *
 * The two worlds share the same `$type` strings, so the guards in this file
 * narrow a value from either producer; only the static type differs.
 *
 * TODO: remove the @atproto/api arms once all producers emit #/lexicons views
 */
export type Embed =
  | {
      type: 'post'
      view:
        | $Typed<app.bsky.embed.record.ViewRecord>
        | $TypedApi<AppBskyEmbedRecord.ViewRecord>
    }
  | {
      type: 'post_not_found'
      view:
        | $Typed<app.bsky.embed.record.ViewNotFound>
        | $TypedApi<AppBskyEmbedRecord.ViewNotFound>
    }
  | {
      type: 'post_blocked'
      view:
        | $Typed<app.bsky.embed.record.ViewBlocked>
        | $TypedApi<AppBskyEmbedRecord.ViewBlocked>
    }
  | {
      type: 'post_detached'
      view:
        | $Typed<app.bsky.embed.record.ViewDetached>
        | $TypedApi<AppBskyEmbedRecord.ViewDetached>
    }
  | {
      type: 'feed'
      view:
        | $Typed<app.bsky.feed.defs.GeneratorView>
        | $TypedApi<AppBskyFeedDefs.GeneratorView>
    }
  | {
      type: 'list'
      view:
        | $Typed<app.bsky.graph.defs.ListView>
        | $TypedApi<AppBskyGraphDefs.ListView>
    }
  | {
      type: 'labeler'
      view:
        | $Typed<app.bsky.labeler.defs.LabelerView>
        | $TypedApi<AppBskyLabelerDefs.LabelerView>
    }
  | {
      type: 'starter_pack'
      view:
        | $Typed<app.bsky.graph.defs.StarterPackViewBasic>
        | $TypedApi<AppBskyGraphDefs.StarterPackViewBasic>
    }
  | {
      type: 'images'
      /*
       * Only the `@atproto/api` view, unlike the other arms: the ImageEmbed
       * consumer reads `view.images` directly, and the `#/lexicons` view is
       * assignable to this slot, so `parseEmbed`'s new-world value flows in
       * while the consumer keeps a single structural shape to read from.
       */
      view: $TypedApi<AppBskyEmbedImages.View>
    }
  | {
      type: 'gallery'
      /*
       * Old-world only for the same reason as the `images` arm above: the
       * consumer narrows `view.items` with `AppBskyEmbedGallery.isViewImage`,
       * which cannot narrow the new view's `Unknown$TypedObject` arm.
       */
      view: $TypedApi<AppBskyEmbedGallery.View>
    }
  | {
      type: 'link'
      view:
        | $Typed<app.bsky.embed.external.View>
        | $TypedApi<AppBskyEmbedExternal.View>
    }
  | {
      type: 'video'
      view:
        | $Typed<app.bsky.embed.video.View>
        | $TypedApi<AppBskyEmbedVideo.View>
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

export function parseEmbed(
  /*
   * Accepts a `PostView.embed` from either world; the `#/lexicons` guards below
   * narrow on `$type`, which is world-independent.
   */
  embed:
    | app.bsky.feed.defs.PostView['embed']
    | AppBskyFeedDefs.PostView['embed'],
): Embed {
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
