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

export type View =
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
      view: View | undefined
      media: View | undefined
    }

export function parseEmbedView(
  view: AppBskyEmbedRecord.View,
): View | undefined {
  if (AppBskyEmbedRecord.isViewRecord(view.record)) {
    return {
      type: 'post',
      view: view.record,
    }
  } else if (AppBskyEmbedRecord.isViewNotFound(view.record)) {
    return {
      type: 'post_not_found',
      view: view.record,
    }
  } else if (AppBskyEmbedRecord.isViewBlocked(view.record)) {
    return {
      type: 'post_blocked',
      view: view.record,
    }
  } else if (AppBskyEmbedRecord.isViewDetached(view.record)) {
    return {
      type: 'post_detached',
      view: view.record,
    }
  } else if (AppBskyFeedDefs.isGeneratorView(view.record)) {
    return {
      type: 'feed',
      view: view.record,
    }
  } else if (AppBskyGraphDefs.isListView(view.record)) {
    return {
      type: 'list',
      view: view.record,
    }
  } else if (AppBskyLabelerDefs.isLabelerView(view.record)) {
    return {
      type: 'labeler',
      view: view.record,
    }
  } else if (AppBskyGraphDefs.isStarterPackViewBasic(view.record)) {
    return {
      type: 'starter_pack',
      view: view.record,
    }
  }
}

export function parseEmbed(
  embed: AppBskyFeedDefs.PostView['embed'],
): View | undefined {
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
    return parseEmbedView(embed)
  } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return {
      type: 'post_with_media',
      view: parseEmbedView(embed.record),
      media: parseEmbed(embed.media),
    }
  }
}
