import {getBlobCidString} from '@atproto/lex'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Match a post's record CID or a blob directly embedded in that post. */
export function postCidMatch(
  post: Pick<app.bsky.feed.defs.PostView, 'cid' | 'record'>,
  subjectCid: string,
): 'record' | 'embed' | undefined {
  if (post.cid === subjectCid) return 'record'
  if (!bsky.matches(app.bsky.feed.post, post.record, {strict: false})) return

  const embed = bsky.isType(
    app.bsky.embed.recordWithMedia.main,
    post.record.embed,
  )
    ? post.record.embed.media
    : post.record.embed

  if (bsky.isType(app.bsky.embed.images.main, embed)) {
    if (
      embed.images.some(({image}) => getBlobCidString(image) === subjectCid)
    ) {
      return 'embed'
    }
  } else if (bsky.isType(app.bsky.embed.video.main, embed)) {
    if (
      getBlobCidString(embed.video) === subjectCid ||
      embed.captions?.some(({file}) => getBlobCidString(file) === subjectCid)
    ) {
      return 'embed'
    }
  } else if (bsky.isType(app.bsky.embed.gallery.main, embed)) {
    if (
      embed.items.some(
        item =>
          bsky.isType(app.bsky.embed.gallery.image, item) &&
          getBlobCidString(item.image) === subjectCid,
      )
    ) {
      return 'embed'
    }
  } else if (bsky.isType(app.bsky.embed.external.main, embed)) {
    if (getBlobCidString(embed.external.thumb) === subjectCid) return 'embed'
  }
}
