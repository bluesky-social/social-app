import {type ModerationOpts} from '@bsky/sdk/moderation'

import {exploreResponseFixture} from '#/screens/Atmosphere/__tests__/fixtures/exploreResponse'
import {livestreamPreviewFixture} from '#/screens/Atmosphere/__tests__/fixtures/livestreamPreview'
import {
  getAtmosphereAnnouncementBanner,
  getAtmosphereApps,
  getAtmosphereArticles,
  getAtmosphereExploreApps,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
  getAtmospherePublications,
  getGalleryImage,
  getGalleryImages,
} from '#/screens/Atmosphere/data/exploreData'
import {app} from '#/lexicons'

/* Moderation fixtures include backing records, which require real CID validation. */
jest.unmock('multiformats/cid')

function parseData(
  data: unknown,
): app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody {
  return app.bsky.unspecced.getAtmosphereExploreTab.$output.schema.parse(data)
}

const fixtureData = parseData(exploreResponseFixture)
const moderationOpts: ModerationOpts = {
  userDid: undefined,
  prefs: {
    adultContentEnabled: true,
    labels: {},
    labelers: [],
    mutedWords: [],
    hiddenPosts: [],
  },
}

const emptyData: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody = {
  articles: {items: []},
  publications: {items: []},
  photos: {items: []},
  livestreams: {items: []},
  apps: [],
}

const emptyAppsData: app.bsky.unspecced.getAtmosphereApps.$OutputBody = {
  apps: [],
}

const testProfile = {
  $type: 'app.bsky.actor.defs#profileViewBasic',
  did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
  handle: 'test.bsky.social',
}

const testPublisher = {
  uri: 'https://example.com/publication',
  title: 'Test publication',
  description: '',
}

const image = {
  $type: 'app.bsky.embed.external#viewGalleryImage',
  thumbnail: 'https://example.com/thumbnail.jpg',
  fullsize: 'https://example.com/fullsize.jpg',
}

describe('Atmosphere Explore response fixtures', () => {
  it('validates a populated synthetic response with nested view metadata', () => {
    expect(fixtureData).toEqual(exploreResponseFixture)
    expect(fixtureData.articles.items[0].view.publisher).toMatchObject({
      $type: 'app.bsky.embed.external#viewArticlePublication',
      logo: 'https://example.com/logo.jpg',
      theme: {
        background: '#ffffff',
        foreground: '#000000',
        accent: '#123456',
        accentForeground: '#ffffff',
      },
    })
    expect(fixtureData.publications.items[0].view.subscriptionCount).toBe(1)
    expect(fixtureData.photos.items[0].view.items[0].$type).toBe(
      'app.bsky.embed.external#viewGalleryImage',
    )
    const photos = getAtmospherePhotos(fixtureData, moderationOpts)
    expect(photos.map(photo => photo.photoCount)).toEqual([42, undefined])
    expect(fixtureData.photos.items[0].view.photoCount).toBe(42)
  })

  it.each(['articles', 'publications', 'photos', 'livestreams'] as const)(
    'validates the %s list envelope and string recommendation ID',
    section => {
      const recIdStr = '18446744073709551615'
      expect(parseData(emptyData)[section]).toEqual({items: []})
      expect(
        parseData({...emptyData, [section]: {items: [], recIdStr}})[section],
      ).toEqual({items: [], recIdStr})
      expect(() => parseData({...emptyData, [section]: []})).toThrow()
      expect(() => parseData({...emptyData, [section]: {}})).toThrow()
      expect(() => parseData({...emptyData, [section]: undefined})).toThrow()
      expect(() =>
        parseData({...emptyData, [section]: {items: [], recIdStr: 123}}),
      ).toThrow()
    },
  )

  it('keeps algorithmic and curated articles and recommendation metadata', () => {
    const items = [...fixtureData.articles.items]
      .reverse()
      .map((item, index) => ({
        ...item,
        featured: index !== 0,
      }))
    const data = parseData({
      ...fixtureData,
      articles: {items, recIdStr: '18446744073709551615'},
    })

    expect(data.articles.recIdStr).toBe('18446744073709551615')
    expect(
      getAtmosphereArticles(data, moderationOpts).map(article => article.uri),
    ).toEqual(items.map(item => item.view.uri))
    expect(data.articles.items.map(item => item.featured)).toEqual([
      false,
      true,
    ])
  })

  it('validates gallery images and skips malformed images during selection', () => {
    expect(app.bsky.embed.external.viewGalleryImage.parse(image)).toMatchObject(
      image,
    )
    expect(() =>
      app.bsky.embed.external.viewGalleryImage.parse({
        ...image,
        thumbnail: 'invalid',
      }),
    ).toThrow()
    const photo = fixtureData.photos.items[0]
    expect(
      getAtmospherePhotos(
        {
          ...fixtureData,
          photos: {
            items: [
              {
                ...photo,
                view: {
                  ...photo.view,
                  items: [{...image, thumbnail: 'invalid'} as never],
                },
              },
            ],
          },
        },
        moderationOpts,
      ),
    ).toEqual([])
  })

  it.each(['articles', 'publications'] as const)(
    'selects at most five %s without mutating the response',
    section => {
      const item = fixtureData[section].items[0]
      const descriptions = [
        '',
        'Short',
        ' \n\t '.repeat(10),
        'The longest description in this list.',
        'Other',
        '  Tiny  ',
        '',
      ]
      const data = parseData({
        ...emptyData,
        [section]: {
          recIdStr: '42',
          items: descriptions.map((description, index) => ({
            ...item,
            featured: index !== 3,
            view: {
              ...item.view,
              uri: `https://example.com/${index}`,
              description,
            },
          })),
        },
      })
      const before = JSON.stringify(data)
      Object.freeze(data[section].items)

      const cards =
        section === 'articles'
          ? getAtmosphereArticles(data, moderationOpts)
          : getAtmospherePublications(data, moderationOpts)

      const expectedOrder =
        section === 'publications' ? [3, 1, 4, 5, 0] : [0, 1, 2, 3, 4]
      expect(cards.map(card => card.uri)).toEqual(
        expectedOrder.map(index => `https://example.com/${index}`),
      )
      expect(JSON.stringify(data)).toBe(before)
      expect(data[section].recIdStr).toBe('42')
    },
  )

  it('keeps the first five articles in server order regardless of images', () => {
    const item = fixtureData.articles.items[0]
    const entries = [
      {description: 'The longest description. '.repeat(10)},
      {description: 'Short', image: 'https://example.com/short.jpg'},
      {description: '', image: 'https://example.com/empty.jpg'},
      {
        description: 'An image article with a longer description',
        image: 'https://example.com/long.jpg',
      },
      {description: 'Tiny'},
      {description: 'Medium text', image: 'https://example.com/medium.jpg'},
    ]
    const data = parseData({
      ...emptyData,
      articles: {
        items: entries.map(({description, image}, index) => ({
          ...item,
          view: {
            ...item.view,
            uri: `https://example.com/${index}`,
            description,
            image,
          },
        })),
      },
    })
    const before = JSON.stringify(data)
    Object.freeze(data.articles.items)

    expect(
      getAtmosphereArticles(data, moderationOpts).map(article => article.uri),
    ).toEqual([0, 1, 2, 3, 4].map(index => `https://example.com/${index}`))
    expect(JSON.stringify(data)).toBe(before)
  })

  it('returns the original lexicon views without flattening fields or dropping metadata', () => {
    const articles = getAtmosphereArticles(fixtureData, moderationOpts)
    expect(articles[0]).toBe(fixtureData.articles.items[0].view)
    expect(articles[1]).toBe(fixtureData.articles.items[1].view)
    expect(articles[0].publisher?.logo).toBe('https://example.com/logo.jpg')

    const photos = getAtmospherePhotos(fixtureData, moderationOpts)
    expect(photos[0]).toBe(fixtureData.photos.items[0].view)
    expect(photos[1]).toBe(fixtureData.photos.items[1].view)
    expect(photos[0].associatedProfiles?.[0].handle).toBe('author.test')
    expect(getAtmosphereAnnouncementBanner(fixtureData)).toBe(
      fixtureData.announcementBanner,
    )
  })

  it('caps articles after deduplication, keeping original views and response metadata', () => {
    const items = Array.from({length: 6}, (_, index) => ({
      ...fixtureData.articles.items[0],
      view: {
        ...fixtureData.articles.items[0].view,
        uri: `https://example.com/article-${index}`,
      },
    }))
    const data = parseData({
      ...emptyData,
      articles: {
        items: [items[0], items[0], ...items.slice(1)],
        recIdStr: '42',
      },
    })
    const before = JSON.stringify(data)
    Object.freeze(data.articles.items)

    expect(getAtmosphereArticles(data, moderationOpts)).toEqual(
      [0, 2, 3, 4, 5].map(index => data.articles.items[index].view),
    )
    expect(JSON.stringify(data)).toBe(before)
  })

  describe('getAtmospherePublications', () => {
    const publicationView = fixtureData.publications.items[0].view
    const withPublications = (
      items: {featured: boolean; view: typeof publicationView}[],
    ) => parseData({...emptyData, publications: {items, recIdStr: '1'}})

    it('returns nothing for an empty list', () => {
      expect(getAtmospherePublications(emptyData, moderationOpts)).toEqual([])
    })

    it('keeps response order for equal-length descriptions, regardless of featured', () => {
      const data = withPublications([
        {featured: false, view: {...publicationView, uri: 'https://a.test/'}},
        {featured: true, view: {...publicationView, uri: 'https://b.test/'}},
        {featured: false, view: {...publicationView, uri: 'https://c.test/'}},
      ])

      expect(
        getAtmospherePublications(data, moderationOpts).map(p => p.uri),
      ).toEqual(['https://a.test/', 'https://b.test/', 'https://c.test/'])
    })

    it('preserves the original publication view, including subscription metadata', () => {
      const [publication] = getAtmospherePublications(
        fixtureData,
        moderationOpts,
      )
      expect(publication).toBe(publicationView)
      expect(publication.subscriptionCount).toBe(1)
    })

    it('copies associated metadata and does not mutate the response', () => {
      /* Built without parsing: only the shape of the refs matters here. */
      const data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody = {
        ...emptyData,
        publications: {
          recIdStr: '1',
          items: [
            {
              featured: true,
              view: {
                ...publicationView,
                associatedRefs: [
                  {
                    uri: 'at://did:plc:6ayddqghxhciedbaofoxkcbs/site.standard.publication/1',
                    cid: 'bafyreiaxduxpwdpjgvve3klfs4flkwjwfqiurszw4o6jvjarpqqmeqwiza',
                  },
                ],
              },
            },
          ],
        },
      }
      const before = JSON.stringify(data)
      const [card] = getAtmospherePublications(data, moderationOpts)

      expect(card.associatedRefs).toEqual(
        data.publications.items[0].view.associatedRefs,
      )
      expect(JSON.stringify(data)).toBe(before)
      expect(data.publications.recIdStr).toBe('1')
    })

    it('keeps publications without a logo, theme, or profiles', () => {
      const {logo, theme, subscribers, ...bare} = publicationView
      const data = withPublications([{featured: false, view: bare}])
      const [card] = getAtmospherePublications(data, moderationOpts)

      expect(card).toBe(data.publications.items[0].view)
      expect(card.logo).toBeUndefined()
      expect(card.theme).toBeUndefined()
      expect(card.associatedProfiles).toBeUndefined()
    })
  })

  describe('dedupes views by URI and apps by id', () => {
    const [article] = fixtureData.articles.items
    const [photo] = fixtureData.photos.items
    const [livestream] = parseData({
      ...emptyData,
      livestreams: {items: livestreamPreviewFixture},
    }).livestreams.items
    const [publication] = fixtureData.publications.items
    const firstApp = {
      id: 'app',
      title: 'Test app',
      url: 'https://example.com/app' as const,
    }

    function twoOf<T extends {view: {uri: string}}>(item: T) {
      return {
        first: item,
        second: {...item, view: {...item.view, uri: 'https://other.test/'}},
      }
    }

    it.each([
      ['articles', article, getAtmosphereArticles],
      ['publications', publication, getAtmospherePublications],
      ['photos', photo, getAtmospherePhotos],
      ['livestreams', livestream, getAtmosphereLivestreams],
    ] as const)('in %s, keeping the first occurrence', (name, item, adapt) => {
      const {first, second} = twoOf(item)
      const duplicate = {
        ...first,
        view: {...first.view, title: 'duplicate'},
      }
      const data = {
        ...emptyData,
        [name]: {items: [first, second, duplicate]},
      }

      const result = adapt(data, moderationOpts)

      expect(result).toHaveLength(2)
      expect(result.map(r => r.uri).sort()).toEqual(
        [first.view.uri, second.view.uri].sort(),
      )
      expect(result.map(r => r.title)).not.toContain('duplicate')
    })

    it('in apps, keeping the first occurrence', () => {
      const data = {
        apps: [
          firstApp,
          {...firstApp, id: 'other'},
          {...firstApp, title: 'dupe'},
        ],
      } satisfies app.bsky.unspecced.getAtmosphereApps.$OutputBody

      const result = getAtmosphereApps(data)

      expect(result.map(r => r.id)).toEqual([firstApp.id, 'other'])
      expect(result[0].title).toBe(firstApp.title)
    })
  })

  describe('getAtmosphereApps', () => {
    const parseApps = (
      data: unknown,
    ): app.bsky.unspecced.getAtmosphereApps.$OutputBody =>
      app.bsky.unspecced.getAtmosphereApps.$output.schema.parse(data)

    it('preserves the hydrated profile, logo and banner', () => {
      const profile = {
        did: testProfile.did,
        handle: 'app.bsky.social',
        viewer: {knownFollowers: {count: 1, followers: [testProfile]}},
      }
      const [card] = getAtmosphereApps(
        parseApps({
          apps: [
            {
              id: 'app',
              title: 'Test app',
              description: 'An app description',
              logo: 'https://example.com/app-logo.jpg',
              banner: 'https://example.com/app-banner.jpg',
              url: 'https://example.com/app',
              category: 'social',
              profile,
            },
          ],
        }),
      )

      expect(card).toEqual({
        id: 'app',
        title: 'Test app',
        description: 'An app description',
        logo: 'https://example.com/app-logo.jpg',
        banner: 'https://example.com/app-banner.jpg',
        url: 'https://example.com/app',
        category: 'social',
        profile,
      })
    })

    it('handles sparse and empty responses', () => {
      expect(getAtmosphereApps(emptyAppsData)).toEqual([])
      expect(
        getAtmosphereApps(
          parseApps({
            apps: [
              {id: 'sparse', title: 'Sparse app', url: 'https://example.com'},
            ],
          }),
        ),
      ).toEqual([
        {
          id: 'sparse',
          title: 'Sparse app',
          url: 'https://example.com',
        },
      ])
    })

    it('keeps apps with a website or a profile, and drops apps with neither', () => {
      const apps = getAtmosphereApps(
        parseApps({
          apps: [
            {id: 'website', title: 'Website', url: 'https://example.com'},
            {
              id: 'profile',
              title: 'Profile',
              profile: {did: testProfile.did, handle: 'app.bsky.social'},
            },
            {id: 'neither', title: 'Neither'},
          ],
        }),
      )

      expect(apps.map(app => app.id)).toEqual(['website', 'profile'])
    })

    it('validates the live response contract', () => {
      expect(() => parseApps({apps: [{url: 'not a uri'}]})).toThrow()
    })
  })

  describe('getAtmosphereApps categories', () => {
    const url = 'https://example.com/app'
    const data = {
      apps: [
        {id: 'writing', title: 'Writing', url, category: 'writing'},
        {id: 'photo', title: 'Photo', url, category: 'photography'},
        {id: 'video', title: 'Video', url, category: 'video'},
        {id: 'feeds', title: 'Feeds', url, category: 'feeds'},
        {id: 'games', title: 'Games', url, category: 'games'},
        {id: 'social', title: 'Social', url, category: 'social'},
        {id: 'dev', title: 'Dev', url, category: 'dev'},
        {id: 'audio', title: 'Audio', url, category: 'audio'},
        {id: 'events', title: 'Events', url, category: 'events'},
        {id: 'utils', title: 'Utils', url, category: 'utils'},
        {id: 'unknown', title: 'Unknown', url, category: 'new-category'},
        {id: 'missing', title: 'Missing', url},
        {id: 'invalid', title: '', url, category: 'writing'},
        {id: 'writing', title: 'Duplicate', url, category: 'writing'},
      ],
    } satisfies app.bsky.unspecced.getAtmosphereApps.$OutputBody

    it('returns every valid app, including unknown and missing categories, without a category', () => {
      expect(getAtmosphereApps(data).map(app => app.id)).toEqual([
        'writing',
        'photo',
        'video',
        'feeds',
        'games',
        'social',
        'dev',
        'audio',
        'events',
        'utils',
        'unknown',
        'missing',
      ])
    })

    it.each([
      ['writing', ['writing']],
      ['photography', ['photo']],
      ['video', ['video']],
      ['feeds', ['feeds']],
      ['games', ['games']],
      ['social', ['social']],
      ['dev', ['dev']],
      ['audio', ['audio']],
      ['events', ['events']],
      ['utils', ['utils']],
      ['empty', []],
    ])(
      'filters raw category %s, still validating and deduping',
      (category, ids) => {
        expect(getAtmosphereApps(data, category).map(app => app.id)).toEqual(
          ids,
        )
      },
    )
  })

  it('selects the active and ended local livestream previews', () => {
    const previewData = parseData({
      ...emptyData,
      livestreams: {items: livestreamPreviewFixture},
    })
    const livestreams = getAtmosphereLivestreams(previewData)

    expect(
      livestreams.map(({title, active, uri}) => ({
        title,
        active,
        uri,
      })),
    ).toEqual([
      {
        title: 'A look at open publishing',
        active: true,
        uri: 'https://example.com/livestreams/open-publishing',
      },
      {
        title: 'Community Q&A',
        active: false,
        uri: 'https://example.com/livestreams/community-q-and-a',
      },
      {
        title: 'Creative coding session',
        active: true,
        uri: 'https://example.com/livestreams/creative-coding',
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

  it('drops articles without a publisher before limiting to five', () => {
    const data = parseData({
      ...emptyData,
      articles: {
        items: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => ({
          featured: false,
          view: {
            uri: `https://example.com/${id}`,
            title: id,
            description: '',
            publisher: id === 'b' ? undefined : testPublisher,
          },
        })),
      },
    })

    expect(
      getAtmosphereArticles(data, moderationOpts).map(article => article.title),
    ).toEqual(['a', 'c', 'd', 'e', 'f'])
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
      title: 'Title only',
      url: 'https://example.com/announcement',
    })
    expect(getAtmosphereArticles(emptyData, moderationOpts)).toEqual([])
    expect(getAtmosphereLivestreams(emptyData)).toEqual([])
    expect(getAtmospherePhotos(emptyData, moderationOpts)).toEqual([])

    const sparseData = parseData({
      ...emptyData,
      announcementBanner: {
        title: 'Title only',
        url: 'https://example.com/announcement',
      },
      articles: {
        items: [
          {
            featured: false,
            view: {
              uri: 'https://example.com/article',
              title: 'Sparse article',
              description: 'No optional card fields',
              publisher: testPublisher,
            },
          },
        ],
      },
      photos: {
        items: [
          {
            featured: false,
            view: {
              uri: 'https://example.com/gallery',
              title: 'Sparse gallery',
              description: '',
              items: [
                {$type: 'app.bsky.embed.external#viewGalleryVideo'},
                image,
              ],
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
      },
      livestreams: {
        items: [
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
      },
    })

    expect(getAtmosphereArticles(sparseData, moderationOpts)[0]).toBe(
      sparseData.articles.items[0].view,
    )
    expect(getAtmospherePhotos(sparseData, moderationOpts)).toEqual([
      sparseData.photos.items[0].view,
    ])
    expect(getAtmosphereLivestreams(sparseData)).toEqual([])
  })

  it('keeps associated profiles that omit $type and drops invalid ones', () => {
    const {$type: _, ...implicitProfile} = testProfile
    const data = parseData({
      ...emptyData,
      articles: {
        items: [
          {
            featured: true,
            view: {
              uri: 'https://example.com/article',
              title: 'Article',
              description: '',
            },
          },
        ],
      },
      photos: {
        items: [
          {
            featured: true,
            view: {
              uri: 'https://example.com/gallery',
              title: 'Gallery',
              description: '',
              items: [image],
              associatedProfiles: [implicitProfile],
            },
          },
        ],
      },
      livestreams: {
        items: [
          {
            featured: true,
            view: {
              uri: 'https://example.com/livestream',
              title: 'Livestream',
              description: '',
              active: true,
              associatedProfiles: [implicitProfile],
            },
          },
        ],
      },
    })

    expect(getAtmospherePhotos(data, moderationOpts)).toHaveLength(1)
    expect(getAtmosphereLivestreams(data)).toHaveLength(1)

    const invalidProfile = {
      ...data.photos.items[0].view,
      associatedProfiles: [{did: 'nope'}],
    }
    expect(
      getAtmospherePhotos(
        {
          ...data,
          photos: {items: [{featured: true, view: invalidProfile as never}]},
        },
        moderationOpts,
      ),
    ).toEqual([])
    expect(getAtmosphereLivestreams({livestreams: {items: []}})).toEqual([])
  })

  it('validates the live response contract', () => {
    expect(() =>
      parseData({...emptyData, apps: [{url: 'not a uri'}]}),
    ).toThrow()
    expect(() =>
      parseData({...emptyData, articles: {items: [{view: {}}]}}),
    ).toThrow()
  })
})

describe('Explore moderation', () => {
  const labeler = 'did:web:labeler.test'
  const opts: ModerationOpts = {
    ...moderationOpts,
    userDid: 'did:web:viewer.test',
    prefs: {
      ...moderationOpts.prefs,
      labels: {porn: 'warn'},
      labelers: [{did: labeler, labels: {}}],
      mutedWords: [{value: 'spoiler', targets: ['content']}],
    },
  }
  const label = (val: string) => ({
    src: labeler,
    uri: 'https://example.com/content',
    val,
    cts: '2026-01-01T00:00:00.000Z',
  })

  it.each([
    ['articles', getAtmosphereArticles],
    ['photos', getAtmospherePhotos],
    ['publications', getAtmospherePublications],
  ] as const)(
    'filters %s before deduplication and leaves the response intact',
    (section, select) => {
      const original = fixtureData[section].items[0]
      const data = parseData({
        ...fixtureData,
        [section]: {
          items: [
            {
              ...original,
              view: {
                ...original.view,
                uri: 'https://example.com/duplicate',
                labels: [label('porn')],
              },
            },
            {
              ...original,
              view: {
                ...original.view,
                uri: 'https://example.com/warning',
                labels: [label('!warn')],
              },
            },
            {
              ...original,
              view: {
                ...original.view,
                uri: 'https://example.com/hidden',
                labels: [label('!hide')],
              },
            },
            {
              ...original,
              view: {
                ...original.view,
                uri: 'https://example.com/word',
                title: 'A spoiler',
              },
            },
            {
              ...original,
              view: {
                ...original.view,
                uri: 'https://example.com/owner-muted',
                associatedRefs: [
                  {
                    uri: 'at://did:web:owner.test/example.test.record/1',
                    cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
                  },
                ],
                associatedProfiles: [
                  {
                    did: 'did:web:owner.test',
                    handle: 'owner.test',
                    viewer: {muted: true},
                  },
                ],
              },
            },
            {
              ...original,
              view: {...original.view, uri: 'https://example.com/duplicate'},
            },
          ],
        },
      })
      const before = JSON.stringify(data)
      const cards = select(data, opts)
      expect(cards).toEqual([data[section].items[5].view])
      expect(JSON.stringify(data)).toBe(before)
      expect(select(data, undefined)).toEqual([])
    },
  )

  it.each([
    ['articles', getAtmosphereArticles],
    ['publications', getAtmospherePublications],
  ] as const)(
    'applies moderation before the five-item limit for %s',
    (section, select) => {
      const original = fixtureData[section].items[0]
      const data = parseData({
        ...emptyData,
        [section]: {
          items: Array.from({length: 7}, (_, index) => ({
            ...original,
            view: {
              ...original.view,
              uri: `https://example.com/${index}`,
              labels: index < 2 ? [label('porn')] : [],
            },
          })),
        },
      })
      expect(select(data, opts).map(view => view.uri)).toEqual(
        [2, 3, 4, 5, 6].map(index => `https://example.com/${index}`),
      )
    },
  )

  it.each(['labels', 'owner mute', 'muted words'])(
    'omits an own article when its separately owned publisher fails %s moderation',
    cause => {
      const article = fixtureData.articles.items[0]
      const publisher = fixtureData.publications.items[0].view
      const data = parseData({
        ...emptyData,
        articles: {
          items: [
            {
              ...article,
              view: {
                ...article.view,
                associatedRefs: [
                  {
                    uri: 'at://did:web:viewer.test/site.standard.document/1',
                    cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
                  },
                ],
                publisher: {
                  ...publisher,
                  title:
                    cause === 'muted words' ? 'A spoiler' : publisher.title,
                  labels: cause === 'labels' ? [label('porn')] : [],
                  associatedRefs: [
                    {
                      uri: 'at://did:web:publisher.test/site.standard.publication/1',
                      cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
                    },
                  ],
                  associatedProfiles: [
                    {
                      did: 'did:web:publisher.test',
                      handle: 'publisher.test',
                      viewer: {muted: cause === 'owner mute'},
                    },
                  ],
                },
              },
            },
          ],
        },
      })
      expect(getAtmosphereArticles(data, opts)).toEqual([])
    },
  )
})

describe('getAtmosphereExploreApps', () => {
  const valid = {
    id: 'app',
    title: 'Test app',
    url: 'https://example.com/app' as const,
    backgroundImage: 'https://example.com/bg.jpg' as const,
  }

  it.each(['id', 'title', 'backgroundImage'] as const)(
    'drops apps missing %s',
    field => {
      const data = parseData({
        ...exploreResponseFixture,
        apps: [
          {...valid, id: 'kept'},
          {...valid, [field]: undefined},
        ],
      })

      expect(getAtmosphereExploreApps(data).map(a => a.id)).toEqual(['kept'])
    },
  )

  it('keeps apps with a website or a profile, and drops apps with neither', () => {
    const data = parseData({
      ...exploreResponseFixture,
      apps: [
        {...valid, id: 'website'},
        {
          ...valid,
          id: 'profile',
          url: undefined,
          profile: {did: 'did:plc:6ayddqghxhciedbaofoxkcbs', handle: 'a.test'},
        },
        {...valid, id: 'neither', url: undefined},
      ],
    })

    expect(getAtmosphereExploreApps(data).map(a => a.id)).toEqual([
      'website',
      'profile',
    ])
  })

  it('dedupes by id, keeping the first in server order', () => {
    const data = parseData({
      ...exploreResponseFixture,
      apps: [valid, {...valid, id: 'other'}, {...valid, title: 'dupe'}],
    })

    const result = getAtmosphereExploreApps(data)

    expect(result.map(a => a.id)).toEqual(['app', 'other'])
    expect(result[0].title).toBe('Test app')
  })
})

describe('getGalleryImages', () => {
  const baseGallery = fixtureData.photos.items[0].view
  const numbered = (n: number) => ({
    ...image,
    thumbnail: `https://example.com/thumb-${n}.jpg`,
    fullsize: `https://example.com/full-${n}.jpg`,
  })
  const galleryOf = (items: unknown[]) =>
    ({...baseGallery, items}) as typeof baseGallery

  it('keeps valid images in order and skips unknown or malformed items', () => {
    const gallery = galleryOf([
      {$type: 'app.test#unknown', value: 1},
      {...numbered(1), thumbnail: 'invalid'},
      numbered(2),
      numbered(3),
    ])

    expect(getGalleryImages(gallery).map(i => i.fullsize)).toEqual([
      'https://example.com/full-2.jpg',
      'https://example.com/full-3.jpg',
    ])
    expect(getGalleryImage(gallery)?.thumbnail).toBe(
      'https://example.com/thumb-2.jpg',
    )
  })

  it('caps at ten valid images, counting only the valid ones', () => {
    const invalid = {...numbered(0), fullsize: 'invalid'}
    const gallery = galleryOf([
      invalid,
      ...Array.from({length: 12}, (_, i) => numbered(i + 1)),
    ])
    const before = JSON.stringify(gallery)

    const images = getGalleryImages(gallery)
    expect(images).toHaveLength(10)
    expect(images[9].fullsize).toBe('https://example.com/full-10.jpg')
    expect(JSON.stringify(gallery)).toBe(before)
  })

  it('returns nothing when no item is usable', () => {
    expect(getGalleryImages(galleryOf([]))).toEqual([])
    expect(getGalleryImage(galleryOf([{$type: 'app.test#unknown'}]))).toBe(
      undefined,
    )
  })
})
