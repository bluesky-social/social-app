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
 * TODO(phase4): drop every `| $TypedApi<AppBsky*>` arm below. This is a
 * dual-world widening of the `Embed` union for the migration interim: the
 * `.view` slots are populated both by `parseEmbed` (which returns `#/lexicons`
 * views, the target) and by call sites that still pass old `@atproto/api`
 * views produced through the bridge agent (e.g. ExternalEmbed, LazyQuoteEmbed).
 * Each variant therefore accepts both worlds until those producers flip, after
 * which the old arms are removed and this becomes a pure new-world union.
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
       * TODO(phase4): flip to `$Typed<app.bsky.embed.images.View>`. Kept on the
       * old `@atproto/api` view for now because the ImageEmbed consumer narrows
       * gallery/images items with old-world `is*` guards that do not narrow the
       * new union's `Unknown$TypedObject` arm. `parseEmbed` produces a new view
       * here; new->old assignability lets it flow into this old slot until the
       * consumer migrates (Task 7).
       */
      view: $TypedApi<AppBskyEmbedImages.View>
    }
  | {
      type: 'gallery'
      /** TODO(phase4): flip to `$Typed<app.bsky.embed.gallery.View>` - see the `images` arm above. */
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
   * TODO(phase4): drop the `| AppBskyFeedDefs.PostView['embed']` arm. Widened
   * for the interim so call sites still passing an old bridge-produced
   * `PostView.embed` typecheck against the `#/lexicons` guards below (which
   * narrow on `$type` regardless of world).
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
