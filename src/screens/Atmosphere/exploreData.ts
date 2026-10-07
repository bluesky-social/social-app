import {app, type com} from '#/lexicons'
import * as bsky from '#/types/bsky'
import atmosphereData from './data.json' with {type: 'json'}

export type AtmosphereLivestreamView = {
  uri: string
  title: string
  description: string
  active: boolean
  createdAt?: string
  updatedAt?: string
  labels?: com.atproto.label.defs.SelfLabels
  associatedRefs?: com.atproto.repo.strongRef.Main[]
  associatedProfiles: app.bsky.actor.defs.ProfileViewBasic[]
  image?: string
  startedAt?: string
  endedAt?: string
}

export type AtmosphereData = Omit<typeof atmosphereData, 'livestreams'> & {
  livestreams: AtmosphereLivestreamView[]
}

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

export type AtmosphereLivestreamCardData = {
  id: string
  href: string
  title: string
  active: boolean
  image?: string
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

export function getAtmosphereLivestreams(
  data: Pick<AtmosphereData, 'livestreams'> = atmosphereData,
): AtmosphereLivestreamCardData[] {
  return data.livestreams.map(livestream => ({
    id: livestream.uri,
    href: livestream.uri,
    title: livestream.title.trim(),
    active: livestream.active,
    image: livestream.image,
    authorProfile: livestream.associatedProfiles[0],
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
