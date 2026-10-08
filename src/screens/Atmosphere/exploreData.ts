import {app, type com} from '#/lexicons'
import * as bsky from '#/types/bsky'
import atmosphereData from './data.json' with {type: 'json'}

/**
 * Temporary local contracts for the external views in the Explore response.
 * Replace these with generated lexicon types when the app's schema includes
 * the definitions introduced by atproto PR #5617.
 */
/** Profile previews are narrowed with the generated actor schema before use. */
type AtmosphereProfileView = {
  $type?: string
  did: string
  handle: string
  displayName?: string
  avatar?: string
  labels?: com.atproto.label.defs.Label[]
}
type AtmosphereStrongRef = Omit<com.atproto.repo.strongRef.Main, 'uri'> & {
  uri: string
}

type AtmosphereExternalViewFields = {
  labels?: com.atproto.label.defs.Label[]
  associatedRefs?: AtmosphereStrongRef[]
  associatedProfiles?: AtmosphereProfileView[]
  createdAt?: string
  updatedAt?: string
}

type AtmospherePublicationTheme = {
  background?: string
  foreground?: string
  accent?: string
  accentForeground?: string
}

type AtmosphereViewArticlePublication = AtmosphereExternalViewFields & {
  $type?: string
  uri: string
  title: string
  description: string
  logo?: string
  image?: string
  theme?: AtmospherePublicationTheme
  subscriptionCount?: number
  /** Available profile previews, limited to three by the endpoint. */
  subscribers?: AtmosphereProfileView[]
}

type AtmosphereViewArticle = AtmosphereExternalViewFields & {
  $type?: string
  uri: string
  title: string
  description: string
  image?: string
  publisher?: AtmosphereViewArticlePublication
  readingTime?: number
  likeCount?: number
  /** Available profile previews, limited to three by the endpoint. */
  likers?: AtmosphereProfileView[]
}

type AtmosphereViewGalleryImage = {
  $type?: string
  thumbnail: string
  fullsize: string
  alt?: string
  aspectRatio?: {width: number; height: number}
}

type AtmosphereUnsupportedGalleryItem = {
  $type?: string
  [key: string]: unknown
}

type AtmosphereViewGallery = AtmosphereExternalViewFields & {
  $type?: string
  uri: string
  title: string
  description: string
  items: (AtmosphereViewGalleryImage | AtmosphereUnsupportedGalleryItem)[]
  likeCount?: number
  /** Available profile previews, limited to three by the endpoint. */
  likers?: AtmosphereProfileView[]
}

export type AtmosphereLivestreamView = AtmosphereExternalViewFields & {
  $type?: string
  uri: string
  title: string
  description: string
  active: boolean
  image?: string
  startedAt?: string
  endedAt?: string
}

type AtmosphereAnnouncementBanner = {
  id?: string
  title?: string
  description?: string
  url?: string
  image?: string
  overlayColor?: string
  textColor?: string
}

type AtmosphereApp = {
  id?: string
  title?: string
  description?: string
  logo?: string
  backgroundImage?: string
  overlayColor?: string
  textColor?: string
  url?: string
  category?: string
}

type FeaturedView<T> = {
  featured: boolean
  view: T
}

export type AtmosphereData = {
  announcementBanner?: AtmosphereAnnouncementBanner
  articles: FeaturedView<AtmosphereViewArticle>[]
  publications: FeaturedView<AtmosphereViewArticlePublication>[]
  photos: FeaturedView<AtmosphereViewGallery>[]
  livestreams: FeaturedView<AtmosphereLivestreamView>[]
  apps: AtmosphereApp[]
}

export type AtmosphereArticleCardData = {
  id: string
  href: string
  title: string
  description?: string
  image?: string
  publisher?: string
  publisherAvatar?: string
}

export type AtmosphereAppCardData = {
  id: string
  title: string
  description?: string
  logo?: string
  backgroundImage?: string
  overlayColor?: string
  textColor?: string
  href: string
}

export type AtmosphereAnnouncementBannerData = {
  id?: string
  title: string
  description?: string
  image?: string
  overlayColor?: string
  textColor?: string
  href: string
}

export type AtmospherePhotoCardData = {
  id: string
  href: string
  title: string
  image: string
  imageAlt?: string
  likeCount: number
  authorProfile: app.bsky.actor.defs.ProfileViewBasic
}

export type AtmosphereLivestreamCardData = {
  id: string
  href: string
  title: string
  active: boolean
  activeCount?: number
  image?: string
  authorProfile: app.bsky.actor.defs.ProfileViewBasic
}

function getProfile(
  profiles?: AtmosphereProfileView[],
): app.bsky.actor.defs.ProfileViewBasic | undefined {
  const profile = profiles?.[0]
  return bsky.isType(app.bsky.actor.defs.profileViewBasic, profile)
    ? profile
    : undefined
}

function isGalleryImage(item: unknown): item is AtmosphereViewGalleryImage {
  if (!item || typeof item !== 'object') return false
  const image = item as Record<string, unknown>
  return (
    image.$type === 'app.bsky.embed.external#viewGalleryImage' &&
    typeof image.thumbnail === 'string' &&
    typeof image.fullsize === 'string' &&
    (image.alt === undefined || typeof image.alt === 'string')
  )
}

export function getAtmosphereArticles(
  data: AtmosphereData = atmosphereData,
): AtmosphereArticleCardData[] {
  return data.articles.map(({view: article}) => ({
    id: article.uri,
    href: article.uri,
    title: article.title.trim(),
    description: article.description || undefined,
    image: article.image,
    publisher: article.publisher?.title,
    publisherAvatar: getProfile(article.associatedProfiles)?.avatar,
  }))
}

export function getAtmosphereApps(
  data: AtmosphereData = atmosphereData,
): AtmosphereAppCardData[] {
  return data.apps.flatMap(app => {
    if (!app.id || !app.title || !app.url) return []

    return [
      {
        id: app.id,
        title: app.title,
        description: app.description || undefined,
        logo: app.logo,
        backgroundImage: app.backgroundImage,
        overlayColor: app.overlayColor,
        textColor: app.textColor,
        href: app.url,
      },
    ]
  })
}

export function getAtmosphereAnnouncementBanner(
  data: AtmosphereData = atmosphereData,
): AtmosphereAnnouncementBannerData | undefined {
  const banner = data.announcementBanner
  if (!banner?.title || !banner.url) return undefined

  return {
    id: banner.id,
    title: banner.title,
    description: banner.description || undefined,
    image: banner.image,
    overlayColor: banner.overlayColor,
    textColor: banner.textColor,
    href: banner.url,
  }
}

export function getAtmosphereLivestreams(
  data: Pick<AtmosphereData, 'livestreams'> = atmosphereData,
): AtmosphereLivestreamCardData[] {
  return data.livestreams.flatMap(({view: livestream}) => {
    const authorProfile = getProfile(livestream.associatedProfiles)
    if (!authorProfile) return []

    return [
      {
        id: livestream.uri,
        href: livestream.uri,
        title: livestream.title.trim(),
        active: livestream.active,
        image: livestream.image,
        authorProfile,
      },
    ]
  })
}

export function getAtmospherePhotos(
  data: AtmosphereData = atmosphereData,
): AtmospherePhotoCardData[] {
  return data.photos.flatMap(({view: photo}) => {
    const image = photo.items.find(isGalleryImage)
    const authorProfile = getProfile(photo.associatedProfiles)
    if (!image || !authorProfile) return []

    return [
      {
        id: photo.uri,
        href: photo.uri,
        title: photo.title,
        image: image.thumbnail,
        imageAlt: image.alt || undefined,
        likeCount: photo.likeCount ?? 0,
        authorProfile,
      },
    ]
  })
}
