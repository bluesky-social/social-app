import {
  AppBskyEmbedGallery,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  type ModerationCause,
  type ModerationUI,
} from '@atproto/api'

import {unique} from '#/lib/moderation'
import {type AppModerationCause} from '#/components/Pills'
import {Features, features} from '#/analytics/features'
import * as bsky from '#/types/bsky'

export const POST_META_NO_CONTENT_OFFSET = {paddingTop: 10}
export const POST_EMBED_NO_CONTENT_OFFSET = {paddingTop: 6}

export function maybeApplyGalleryOffsetStyles(
  placement: 'meta' | 'embed',
  {
    post,
    modui,
    additionalCauses,
  }: {
    post: AppBskyFeedDefs.PostView
    modui: ModerationUI
    additionalCauses?: ModerationCause[] | AppModerationCause[]
  },
) {
  if (
    !bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    return
  }

  // The gate only controls whether legacy image embeds opt into the new
  // expanded gallery layout. Gallery embeds always render expanded by item
  // count, so their offset must apply regardless of the gate.
  const isPostGalleryEmbedEnabled = features.isOn(
    Features.PostGalleryEmbedEnable,
  )

  /*
   * First check if we even have images
   */
  const embed = post.record.embed
  const isImageEmbed =
    embed &&
    bsky.dangerousIsType<AppBskyEmbedImages.Main>(
      embed,
      AppBskyEmbedImages.isMain,
    )
  const isGalleryEmbed =
    embed &&
    bsky.dangerousIsType<AppBskyEmbedGallery.Main>(
      embed,
      AppBskyEmbedGallery.isMain,
    )
  const isRecordWithMedia =
    embed &&
    bsky.dangerousIsType<AppBskyEmbedRecordWithMedia.Main>(
      embed,
      AppBskyEmbedRecordWithMedia.isMain,
    )
  let hasImages = false
  if (isImageEmbed) {
    if (!isPostGalleryEmbedEnabled) return
    // one image, not a gallery
    if (embed.images.length === 1) return
    hasImages = true
  }
  if (isGalleryEmbed) {
    // single (or empty) gallery - no offset needed
    if (embed.items.length <= 1) return
    hasImages = true
  }
  if (isRecordWithMedia) {
    if (
      bsky.dangerousIsType<AppBskyEmbedImages.Main>(
        embed.media,
        AppBskyEmbedImages.isMain,
      )
    ) {
      if (!isPostGalleryEmbedEnabled) return
      // one image, not a gallery
      if (embed.media.images.length === 1) return
    }
    if (
      bsky.dangerousIsType<AppBskyEmbedGallery.Main>(
        embed.media,
        AppBskyEmbedGallery.isMain,
      )
    ) {
      // single (or empty) gallery - no offset needed
      if (embed.media.items.length <= 1) return
    }
    hasImages = true
  }
  if (!hasImages) return

  /*
   * Then check if we have any text
   */
  let hasLabels = false
  if (modui.alert) {
    hasLabels = modui.alerts.filter(unique).length > 0
  }
  if (modui.inform) {
    hasLabels = hasLabels || modui.informs.filter(unique).length > 0
  }
  if (additionalCauses?.length) {
    hasLabels = true
  }

  /*
   * If no text or labels, then we need a lil bump
   */
  const shouldApplyOffset = !post.record.text && !hasLabels

  return shouldApplyOffset
    ? placement === 'meta'
      ? POST_META_NO_CONTENT_OFFSET
      : POST_EMBED_NO_CONTENT_OFFSET
    : {}
}
