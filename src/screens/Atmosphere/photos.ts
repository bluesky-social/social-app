import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {activityCollections} from '#/screens/Atmosphere/types'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Gallery and lightbox share this cap; the original activity group stays intact. */
const MAX_GRAIN_PHOTOS = 10

export function getGrainPhotos(
  item: ActivityPresentationItem,
): app.bsky.embed.images.ViewImage[] {
  const photos: app.bsky.embed.images.ViewImage[] = []
  const activities =
    item.type === 'activity' ? [item.activity] : item.group.items
  for (const activity of activities) {
    if (
      activity.collection !== activityCollections.grainGallery &&
      activity.collection !== activityCollections.grainFavorite
    )
      continue
    if (!bsky.isType(app.bsky.embed.external.viewGallery, activity.view))
      continue
    for (const image of activity.view.items) {
      if (!bsky.isType(app.bsky.embed.external.viewGalleryImage, image))
        continue
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
  }
  return photos
}
