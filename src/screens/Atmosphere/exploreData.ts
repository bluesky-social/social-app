import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import atmosphereData from './data.json' with {type: 'json'}

export type AtmosphereData = typeof atmosphereData

export type AtmosphereArticleCardData = {
  id: string
  href: string
  title: string
  description?: string
  image: string
  publisher: string
  publisherAvatar?: string
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

export function getAtmosphereArticles(
  data: AtmosphereData = atmosphereData,
): AtmosphereArticleCardData[] {
  return data.articles.map(article => ({
    id: article.uri,
    href: article.uri,
    title: article.title.trim(),
    description: article.description || undefined,
    image: article.image,
    publisher: article.publisher.title,
    publisherAvatar: article.associatedProfiles[0]?.avatar,
  }))
}

export function getAtmospherePhotos(
  data: AtmosphereData = atmosphereData,
): AtmospherePhotoCardData[] {
  return data.photos.flatMap(photo => {
    const image = photo.images[0]
    const authorProfile = photo.associatedProfiles[0]
    if (
      !image ||
      !bsky.isType(app.bsky.actor.defs.profileViewBasic, authorProfile)
    ) {
      return []
    }

    return [
      {
        id: photo.uri,
        href: photo.uri,
        title: photo.title,
        image: image.thumb,
        imageAlt: image.alt || undefined,
        likeCount: photo.likeCount,
        authorProfile,
      },
    ]
  })
}
