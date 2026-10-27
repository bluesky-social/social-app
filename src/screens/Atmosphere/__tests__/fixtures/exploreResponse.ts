import {type AtmosphereData} from '#/screens/Atmosphere/data/exploreData'
import {type app} from '#/lexicons'

const author: app.bsky.actor.defs.ProfileViewBasic = {
  $type: 'app.bsky.actor.defs#profileViewBasic',
  did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
  handle: 'author.test',
  avatar: 'https://example.com/avatar.jpg',
}

const publication: app.bsky.embed.external.ViewArticlePublication = {
  $type: 'app.bsky.embed.external#viewArticlePublication',
  uri: 'https://example.com/publication',
  title: 'Test publication',
  description: 'A publication description',
  logo: 'https://example.com/logo.jpg',
  theme: {
    background: '#ffffff',
    foreground: '#000000',
    accent: '#123456',
    accentForeground: '#ffffff',
  },
  subscriptionCount: 1,
  subscribers: [author],
}

const image = {
  $type: 'app.bsky.embed.external#viewGalleryImage' as const,
  thumbnail: 'https://example.com/thumbnail.jpg' as const,
  fullsize: 'https://example.com/fullsize.jpg' as const,
  alt: 'A test photo',
}

/** Small synthetic response for schema, mapping, and screen tests. */
export const exploreResponseFixture: AtmosphereData = {
  announcementBanner: {
    id: 'banner',
    title: 'Test announcement',
    description: 'An announcement description',
    url: 'https://example.com/announcement',
    image: 'https://example.com/banner.jpg',
    overlayColor: '#000000',
    textColor: '#ffffff',
  },
  articles: {
    items: [
      {
        featured: true,
        view: {
          $type: 'app.bsky.embed.external#viewArticle',
          uri: 'https://example.com/first-article',
          title: ' First article ',
          description: '',
          image: 'https://example.com/article.jpg',
          publisher: publication,
          associatedProfiles: [author],
          likeCount: 1,
          likers: [author],
        },
      },
      {
        featured: true,
        view: {
          $type: 'app.bsky.embed.external#viewArticle',
          uri: 'https://example.com/second-article',
          title: 'Second article',
          description: 'An article description',
          publisher: publication,
        },
      },
    ],
  },
  publications: {items: [{featured: true, view: publication}]},
  photos: {
    items: ['First photo', 'Second photo'].map((title, index) => ({
      featured: true,
      view: {
        $type: 'app.bsky.embed.external#viewGallery',
        uri: `https://example.com/gallery-${index}`,
        title,
        description: '',
        items: [image],
        associatedProfiles: [author],
        likeCount: 2,
        likers: [author],
      },
    })),
  },
  livestreams: {items: []},
  apps: [
    {
      id: 'app',
      title: 'Test app',
      description: 'An app description',
      logo: 'https://example.com/app-logo.jpg',
      backgroundImage: 'https://example.com/app-background.jpg',
      overlayColor: '#123456',
      textColor: '#ffffff',
      url: 'https://example.com/app',
    },
  ],
}
