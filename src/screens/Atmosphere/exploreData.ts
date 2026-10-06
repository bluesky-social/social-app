import atmosphereData from './data.json'

export type AtmosphereData = typeof atmosphereData

export type AtmosphereArticleCardData = {
  id: string
  href: string
  title: string
  description?: string
  image: {
    src: string
  }
  publisher: string
  publisherAvatar?: string
}

export function getAtmosphereArticles(
  data: AtmosphereData = atmosphereData,
): AtmosphereArticleCardData[] {
  return data.articles.map(article => ({
    id: article.uri,
    href: article.uri,
    title: article.title.trim(),
    description: article.description || undefined,
    image: {
      src: article.image,
    },
    publisher: article.publisher.title,
    publisherAvatar: article.associatedProfiles[0]?.avatar,
  }))
}
