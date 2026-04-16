import {
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
  // don't ever check gates like this, except this one time
  if (!features.isOn(Features.PostGalleryEmbedEnable)) return

  if (
    !bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    return
  }

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
  const isRecordWithMedia =
    embed &&
    bsky.dangerousIsType<AppBskyEmbedRecordWithMedia.Main>(
      embed,
      AppBskyEmbedRecordWithMedia.isMain,
    )
  let hasImages = false
  if (isImageEmbed) {
    // one image, not a gallery
    if (embed.images.length === 1) return
    hasImages = true
  }
  if (isRecordWithMedia) {
    if (
      bsky.dangerousIsType<AppBskyEmbedImages.Main>(
        embed.media,
        AppBskyEmbedImages.isMain,
      )
    ) {
      // one image, not a gallery
      if (embed.media.images.length === 1) return
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
