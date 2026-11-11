import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {getActivityContent} from '#/screens/Atmosphere/relationships'
import {activityCollections} from '#/screens/Atmosphere/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Gallery and lightbox share this cap; the original activity group stays intact. */
const MAX_GRAIN_PHOTOS = 10

type GrainPhoto = app.bsky.embed.images.ViewImage & {
  aspectRatio: app.bsky.embed.defs.AspectRatio
}

export function getGrainPhotos(item: ActivityPresentationItem): GrainPhoto[] {
  const photos: GrainPhoto[] = []
  const content = getActivityContent(item)
  const collection =
    item.type === 'activity' ? item.activity.collection : item.group.collection
  if (
    !content ||
    (collection !== activityCollections.grainGallery &&
      collection !== activityCollections.grainFavorite) ||
    !bsky.isType(app.bsky.embed.external.viewGallery, content.view)
  )
    return photos

  for (const image of content.view.items) {
    if (!bsky.isType(app.bsky.embed.external.viewGalleryImage, image)) continue
    const ratio = image.aspectRatio
    const aspectRatio =
      ratio &&
      Number.isFinite(ratio.width) &&
      Number.isFinite(ratio.height) &&
      ratio.width > 0 &&
      ratio.height > 0 &&
      Number.isFinite(ratio.width / ratio.height) &&
      ratio.width / ratio.height > 0
        ? ratio
        : {width: 1, height: 1}
    photos.push({
      thumb: image.thumbnail,
      fullsize: image.fullsize,
      alt: image.alt ?? '',
      aspectRatio,
    })
    if (photos.length === MAX_GRAIN_PHOTOS) return photos
  }
  return photos
}
