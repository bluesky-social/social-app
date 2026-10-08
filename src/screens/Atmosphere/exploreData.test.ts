import atmosphereData from './data.json' with {type: 'json'}
import {
  type AtmosphereData,
  getAtmosphereAnnouncementBanner,
  getAtmosphereApps,
  getAtmosphereArticles,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
} from './exploreData'
import {livestreamPreviewFixture} from './fixtures/livestreamPreview'

const emptyData: AtmosphereData = {
  articles: [],
  publications: [],
  photos: [],
  livestreams: [],
  apps: [],
}

const testProfile = {
  $type: 'app.bsky.actor.defs#profileViewBasic',
  did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
  handle: 'test.bsky.social',
}

const image = {
  $type: 'app.bsky.embed.external#viewGalleryImage',
  thumbnail: 'https://example.com/thumbnail.jpg',
  fullsize: 'https://example.com/fullsize.jpg',
}

describe('Atmosphere Explore response fixtures', () => {
  it('uses the endpoint envelope and canonical view discriminators', () => {
    const data: AtmosphereData = atmosphereData

    expect(
      data.articles.every(item => typeof item.featured === 'boolean'),
    ).toBe(true)
    expect(
      data.publications.every(item => typeof item.featured === 'boolean'),
    ).toBe(true)
    expect(data.photos.every(item => typeof item.featured === 'boolean')).toBe(
      true,
    )
    expect(data.livestreams).toEqual([])
    expect(
      data.apps.every(app => !('view' in app) && !('featured' in app)),
    ).toBe(true)

    for (const item of data.articles) {
      expect(item.view.$type).toBe('app.bsky.embed.external#viewArticle')
      expect(item.view.likers?.length ?? 0).toBeLessThanOrEqual(3)
      expect(item.view).not.toHaveProperty('recommendCount')
      expect(item.view).not.toHaveProperty('recommenders')
      expect(item.view.publisher?.$type).toBe(
        'app.bsky.embed.external#viewArticlePublication',
      )
      expect(item.view.publisher).not.toHaveProperty('icon')
    }

    for (const item of data.publications) {
      expect(item.view.$type).toBe(
        'app.bsky.embed.external#viewArticlePublication',
      )
      expect(item.view.subscriptionCount).toBeGreaterThanOrEqual(0)
      expect(item.view).not.toHaveProperty('publisher')
      expect(item.view).not.toHaveProperty('subscriberCount')
      expect(item.view).not.toHaveProperty('icon')
      expect(item.view.subscribers?.length ?? 0).toBeLessThanOrEqual(3)
    }

    for (const item of data.photos) {
      expect(item.view.$type).toBe('app.bsky.embed.external#viewGallery')
      expect(item.view.items.length).toBeLessThanOrEqual(10)
      expect(item.view).not.toHaveProperty('images')
      expect(
        item.view.items.every(
          image =>
            typeof image === 'object' &&
            image !== null &&
            '$type' in image &&
            image.$type === 'app.bsky.embed.external#viewGalleryImage',
        ),
      ).toBe(true)
      for (const image of item.view.items) {
        expect(image).not.toHaveProperty('thumb')
      }
    }

    expect(data.articles[0].view.publisher?.logo).toBe(
      'https://cdn.bsky.app/img/avatar/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreia2oxf6i34p25yfny2joydlaqpgkzn2x7pipstjayrx7oziw7ue4i@webp',
    )
    expect(data.articles[0].view.publisher?.theme).toEqual({
      background: '#fdfcfa',
      foreground: '#000000',
      accent: '#3b2a7e',
      accentForeground: '#ffffff',
    })
    expect(data.publications[1].view.theme).toEqual({
      background: '#ffffff',
      foreground: '#18181b',
      accent: '#eab308',
      accentForeground: '#18181b',
    })
    expect(data.announcementBanner).not.toHaveProperty('view')
  })

  it('preserves the populated card presentation and ordering', () => {
    const articles = getAtmosphereArticles()
    expect(
      articles.map(({title, publisher, description}) => ({
        title,
        publisher,
        description,
      })),
    ).toEqual([
      {
        title: 'Announcing Aster - a home for researchers on the open web',
        publisher: 'Aster Blog',
        description: undefined,
      },
      {
        title: 'A Is for Aliens. A Is for Alison.',
        publisher: 'Brookie’s Blog',
        description:
          'Rewatching the X-Files and Pretty Little Liars again. They both have such good pilot episodes. So much drama, so much suspense, so much mystery.',
      },
    ])
    expect(articles[0]).toMatchObject({
      href: 'https://blog.aster.place/3mwqgs7dp2s2a',
      image:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreidvntdnpe3nzj7wkdxjuhutbf5g7lozznoe7gosqgw3xc2mx3i3om@webp',
      publisherAvatar:
        'https://cdn.bsky.app/img/avatar/plain/did:plc:ifn645rwvsuolxg7o3w7ouo4/bafkreicid7hoyx5d2if24eryyhb3lg4ioy2mdrmiriga3k2cay6k5io4ta',
    })

    const photos = getAtmospherePhotos()
    expect(photos.map(({title}) => title)).toEqual([
      'evening ride',
      'Chandelier 2',
      'Mt Rinjani Summit Climb',
      "Cookin' with Alf",
    ])
    expect(photos[0]).toMatchObject({
      href: 'https://grain.social/profile/did:plc:bcgltzqazw5tb6k2g3ttenbj/gallery/3mwurhuhb742g',
      image:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:bcgltzqazw5tb6k2g3ttenbj/bafkreicdzasac4qdo6ls5pixbirmojx6oxdnxcsgbvzskvtxgbk4zhxhdi@jpeg',
      likeCount: 2,
      imageAlt: undefined,
      authorProfile: {handle: 'chadtmiller.com'},
    })

    expect(getAtmosphereApps()).toEqual([
      {
        id: 'd7ea9a5058e7',
        title: 'Leaflet',
        description: 'Delightful publishing to connect with your community',
        logo: expect.stringContaining(
          '/images/image-f3d78d0ed8e296e01d0fde7f6166ce6373c6c1b0-88x88-',
        ),
        backgroundImage: expect.stringContaining(
          '/images/image-abdae35a8f9dab80eff8051453c8e35de07b',
        ),
        overlayColor: '#57822b',
        textColor: '#FFF',
        href: 'https://leaflet.pub',
      },
    ])
    expect(getAtmosphereAnnouncementBanner()).toEqual({
      id: 'bd4b135a8995',
      title: 'Atmosphere Tab Launch Party 2026',
      description: 'Boop',
      image:
        'https://app-cms-production.bsky.workers.dev/images/image-0a7748426cbd27b63c04a608d930120d2beb9727-3000x2000-jpg/large',
      overlayColor: '#000',
      textColor: '#fff',
      href: 'https://bsky.app',
    })
  })

  it('adapts the active and ended local livestream previews', () => {
    const livestreams = getAtmosphereLivestreams({
      livestreams: livestreamPreviewFixture,
    })

    expect(
      livestreams.map(({title, active, href}) => ({
        title,
        active,
        href,
      })),
    ).toEqual([
      {
        title: 'A look at open publishing',
        active: true,
        href: 'https://example.com/livestreams/open-publishing',
      },
      {
        title: 'Community Q&A',
        active: false,
        href: 'https://example.com/livestreams/community-q-and-a',
      },
      {
        title: 'Creative coding session',
        active: true,
        href: 'https://example.com/livestreams/creative-coding',
      },
    ])
    expect(
      livestreamPreviewFixture.every(
        item =>
          item.featured &&
          item.view.$type === 'app.bsky.embed.external#viewLivestream',
      ),
    ).toBe(true)
    expect(livestreams[0].image).toBe(livestreamPreviewFixture[0].view.image)
  })

  it('safely handles absent optional data, empty arrays, and gallery variants', () => {
    expect(getAtmosphereAnnouncementBanner(emptyData)).toBeUndefined()
    expect(
      getAtmosphereAnnouncementBanner({
        ...emptyData,
        announcementBanner: {
          title: 'Title only',
          url: 'https://example.com/announcement',
        },
      }),
    ).toEqual({
      id: undefined,
      title: 'Title only',
      description: undefined,
      image: undefined,
      overlayColor: undefined,
      textColor: undefined,
      href: 'https://example.com/announcement',
    })
    expect(getAtmosphereArticles(emptyData)).toEqual([])
    expect(getAtmosphereApps(emptyData)).toEqual([])
    expect(getAtmosphereLivestreams(emptyData)).toEqual([])
    expect(getAtmospherePhotos(emptyData)).toEqual([])

    const sparseData: AtmosphereData = {
      ...emptyData,
      announcementBanner: {
        title: 'Title only',
        url: 'https://example.com/announcement',
      },
      articles: [
        {
          featured: false,
          view: {
            uri: 'https://example.com/article',
            title: 'Sparse article',
            description: 'No optional card fields',
          },
        },
      ],
      photos: [
        {
          featured: false,
          view: {
            uri: 'https://example.com/gallery',
            title: 'Sparse gallery',
            description: '',
            items: [{$type: 'app.bsky.embed.external#viewGalleryVideo'}, image],
            associatedProfiles: [testProfile],
          },
        },
        {
          featured: false,
          view: {
            uri: 'https://example.com/unsupported-gallery',
            title: 'No supported image',
            description: '',
            items: [{$type: 'app.bsky.embed.external#viewGalleryVideo'}],
            associatedProfiles: [testProfile],
          },
        },
        {
          featured: false,
          view: {
            uri: 'https://example.com/gallery-without-profile',
            title: 'No profile',
            description: '',
            items: [image],
          },
        },
      ],
      livestreams: [
        {
          featured: false,
          view: {
            uri: 'https://example.com/livestream-without-profile',
            title: 'No profile',
            description: '',
            active: true,
          },
        },
      ],
      apps: [
        {id: 'sparse-app', title: 'Sparse app', url: 'https://example.com'},
      ],
    }

    expect(getAtmosphereArticles(sparseData)[0]).toMatchObject({
      title: 'Sparse article',
      image: undefined,
      publisher: undefined,
      publisherAvatar: undefined,
    })
    expect(getAtmospherePhotos(sparseData)).toEqual([
      {
        id: 'https://example.com/gallery',
        href: 'https://example.com/gallery',
        title: 'Sparse gallery',
        image: image.thumbnail,
        imageAlt: undefined,
        likeCount: 0,
        authorProfile: testProfile,
      },
    ])
    expect(getAtmosphereLivestreams(sparseData)).toEqual([])
    expect(getAtmosphereApps(sparseData)).toEqual([
      {
        id: 'sparse-app',
        title: 'Sparse app',
        description: undefined,
        logo: undefined,
        backgroundImage: undefined,
        overlayColor: undefined,
        textColor: undefined,
        href: 'https://example.com',
      },
    ])
  })
})
