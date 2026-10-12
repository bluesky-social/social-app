import {type l} from '@atproto/lex'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type AtmosphereData, viewGalleryImage} from './exploreApi'

export type {AtmosphereData}

type AtmosphereProfileView = l.InferOutput<
  typeof app.bsky.actor.defs.profileViewBasic
>
type AtmosphereViewGalleryItem =
  AtmosphereData['photos'][number]['view']['items'][number]
type AtmosphereViewGalleryImage = Extract<
  AtmosphereViewGalleryItem,
  {$type: 'app.bsky.embed.external#viewGalleryImage'}
>

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
  /*
   * Associated profiles from the appview omit `$type`, so a `$type` check
   * would reject valid profiles. Fully validate instead, which permits an
   * implicit `$type`.
   */
  return bsky.matches(app.bsky.actor.defs.profileViewBasic, profile)
    ? profile
    : undefined
}

function isGalleryImage(item: unknown): item is AtmosphereViewGalleryImage {
  return (
    bsky.isType(viewGalleryImage, item) && bsky.matches(viewGalleryImage, item)
  )
}

export function getAtmosphereArticles(
  data: AtmosphereData,
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
  data: AtmosphereData,
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
  data: AtmosphereData,
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
  data: Pick<AtmosphereData, 'livestreams'>,
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
  data: AtmosphereData,
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
