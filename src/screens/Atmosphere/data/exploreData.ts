import {type $Typed, type UriString} from '@atproto/lex'
import {
  mergeModUIResults,
  type ModerationOpts,
  type ModerationSubjectExternalView,
} from '@bsky/sdk/moderation'

import {moderateExternalView} from '#/lib/moderation/moderateExternalView'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Keeps the first item for each key, preserving order. */
function dedupeBy<T>(items: T[], getKey: (item: T) => string | undefined): T[] {
  const seen = new Set<string | undefined>()
  return items.filter(item => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getAssociatedProfile(
  profiles?: app.bsky.actor.defs.ProfileViewBasic[],
): app.bsky.actor.defs.ProfileViewBasic | undefined {
  const profile = profiles?.[0]
  /*
   * Associated profiles from the appview omit `$type`, so a `$type` check
   * would reject valid profiles. Fully validate instead, which permits an
   * implicit `$type`.
   */
  return bsky.matches(app.bsky.actor.defs.profileViewBasic, profile)
    ? profile
    : undefined
}

/** The most images the photo dialog shows from one gallery. */
const MAX_GALLERY_IMAGES = 10

/**
 * Valid, supported images in server order, capped at ten. Unsupported union
 * members and images that fail schema validation are skipped.
 */
export function getGalleryImages(
  gallery: app.bsky.embed.external.ViewGallery,
): $Typed<app.bsky.embed.external.ViewGalleryImage>[] {
  return gallery.items
    .filter(
      (item): item is $Typed<app.bsky.embed.external.ViewGalleryImage> =>
        bsky.isType(app.bsky.embed.external.viewGalleryImage, item) &&
        bsky.matches(app.bsky.embed.external.viewGalleryImage, item),
    )
    .slice(0, MAX_GALLERY_IMAGES)
}

export function getGalleryImage(
  gallery: app.bsky.embed.external.ViewGallery,
): $Typed<app.bsky.embed.external.ViewGalleryImage> | undefined {
  return getGalleryImages(gallery)[0]
}

/** Explore omits cards that would need either a content or media blur. */
function isExternalViewVisible(
  view: ModerationSubjectExternalView,
  opts: ModerationOpts,
): boolean {
  const moderation = moderateExternalView(view, opts)
  const ui = mergeModUIResults(
    moderation.ui('contentList'),
    moderation.ui('contentView'),
    moderation.ui('contentMedia'),
  )
  return !ui.filter && !ui.blur
}

export function getAtmosphereArticles(
  data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody,
  moderationOpts: ModerationOpts | undefined,
): app.bsky.embed.external.ViewArticle[] {
  if (!moderationOpts) return []
  return dedupeBy(
    data.articles.items
      .map(({view}) => view)
      .filter(
        article =>
          article.publisher &&
          isExternalViewVisible(article, moderationOpts) &&
          isExternalViewVisible(article.publisher, moderationOpts),
      ),
    article => article.uri,
  ).slice(0, 5)
}

export function getAtmospherePublications(
  data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody,
  moderationOpts: ModerationOpts | undefined,
): app.bsky.embed.external.ViewArticlePublication[] {
  if (!moderationOpts) return []
  return dedupeBy(
    data.publications.items
      .map(({view}) => view)
      .filter(publication =>
        isExternalViewVisible(publication, moderationOpts),
      ),
    publication => publication.uri,
  )
    .sort((a, b) => b.description.trim().length - a.description.trim().length)
    .slice(0, 5)
}
/**
 * Returns the valid apps, optionally limited to a raw backend `category`.
 * Omit `category` for all apps, including those with a missing or unknown
 * category. Apps need a website or a profile to link to.
 */
export function getAtmosphereApps(
  data: app.bsky.unspecced.getAtmosphereApps.$OutputBody,
  category?: string,
): app.bsky.unspecced.getAtmosphereApps.AppCard[] {
  return dedupeBy(
    data.apps.filter(
      app =>
        app.id &&
        app.title &&
        (app.url || app.profile) &&
        (category === undefined || app.category === category),
    ),
    app => app.id,
  )
}

/** An explore app with the fields the featured card can't render without. */
export type FeaturedApp = app.bsky.unspecced.getAtmosphereExploreTab.AppCard & {
  id: string
  title: string
  backgroundImage: UriString
}

/**
 * Returns the valid apps for the featured gallery. Unlike the Apps tab, these
 * need a banner image because the card is built around it. Like the Apps tab,
 * they need a website or a profile to link to.
 */
export function getAtmosphereExploreApps(
  data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody,
): FeaturedApp[] {
  return dedupeBy(
    data.apps.filter(
      (app): app is FeaturedApp =>
        !!(
          app.id &&
          app.title &&
          app.backgroundImage &&
          (app.url || app.profile)
        ),
    ),
    app => app.id,
  )
}

export function getAtmosphereAnnouncementBanner(
  data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody,
): app.bsky.unspecced.getAtmosphereExploreTab.AnnouncementBanner | undefined {
  const banner = data.announcementBanner
  return banner?.title && banner.url ? banner : undefined
}

export function getAtmosphereLivestreams(
  data: Pick<
    app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody,
    'livestreams'
  >,
): app.bsky.embed.external.ViewLivestream[] {
  return dedupeBy(
    data.livestreams.items
      .map(({view}) => view)
      .filter(livestream =>
        getAssociatedProfile(livestream.associatedProfiles),
      ),
    livestream => livestream.uri,
  )
}

export function getAtmospherePhotos(
  data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody,
  moderationOpts: ModerationOpts | undefined,
): app.bsky.embed.external.ViewGallery[] {
  if (!moderationOpts) return []
  return dedupeBy(
    data.photos.items
      .map(({view}) => view)
      .filter(
        photo =>
          getGalleryImage(photo) &&
          getAssociatedProfile(photo.associatedProfiles) &&
          isExternalViewVisible(photo, moderationOpts),
      ),
    photo => photo.uri,
  )
}
