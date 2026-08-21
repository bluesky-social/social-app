import {type ModerationCause, type ModerationUI} from '@bsky/sdk/moderation'

import {unique} from '#/lib/moderation'
import {type AppModerationCause} from '#/components/Pills'
import {Features, features} from '#/analytics/features'
import * as AppBskyEmbedGallery from '#/lexicons/app/bsky/embed/gallery'
import * as AppBskyEmbedImages from '#/lexicons/app/bsky/embed/images'
import * as AppBskyEmbedRecordWithMedia from '#/lexicons/app/bsky/embed/recordWithMedia'
import type * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyFeedPost from '#/lexicons/app/bsky/feed/post'
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
  if (!bsky.isType(AppBskyFeedPost, post.record)) {
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
  const isImageEmbed = embed && bsky.isType(AppBskyEmbedImages.main, embed)
  const isGalleryEmbed = embed && bsky.isType(AppBskyEmbedGallery.main, embed)
  const isRecordWithMedia =
    embed && bsky.isType(AppBskyEmbedRecordWithMedia.main, embed)
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
    if (bsky.isType(AppBskyEmbedImages.main, embed.media)) {
      if (!isPostGalleryEmbedEnabled) return
      // one image, not a gallery
      if (embed.media.images.length === 1) return
      hasImages = true
    }
    if (bsky.isType(AppBskyEmbedGallery.main, embed.media)) {
      // single (or empty) gallery - no offset needed
      if (embed.media.items.length <= 1) return
      hasImages = true
    }
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
