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
} from '#/screens/Atmosphere/data/exploreData'
import {app} from '#/lexicons'

function parseData(
  data: unknown,
): app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody {
  return app.bsky.unspecced.getAtmosphereExploreTab.$output.schema.parse(data)
}

const fixtureData = parseData(exploreResponseFixture)

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
    expect(getAtmosphereArticles(data).map(article => article.uri)).toEqual(
      items.map(item => item.view.uri),
    )
    expect(data.articles.items.map(item => item.featured)).toEqual([
      false,
      true,
    ])
  })

  it.each([
    {
      schema: app.bsky.embed.external.viewArticle,
      view: fixtureData.articles.items[0].view,
    },
    {
      schema: app.bsky.embed.external.viewArticlePublication,
      view: fixtureData.publications.items[0].view,
    },
    {
      schema: app.bsky.embed.external.viewGallery,
      view: fixtureData.photos.items[0].view,
    },
    {
      schema: app.bsky.embed.external.viewLivestream,
      view: livestreamPreviewFixture[0].view,
    },
  ])('uses generated validation for $view.$type', ({schema, view}) => {
    expect(schema.parse(view)).toMatchObject(view)
    expect(() => schema.parse({...view, uri: 'invalid'})).toThrow()
    expect(() =>
      schema.parse({...view, associatedProfiles: [{did: 'nope'}]}),
    ).toThrow()
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
      getAtmospherePhotos({
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
      }),
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
          ? getAtmosphereArticles(data)
          : getAtmospherePublications(data)

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

    expect(getAtmosphereArticles(data).map(article => article.uri)).toEqual(
      [0, 1, 2, 3, 4].map(index => `https://example.com/${index}`),
    )
    expect(JSON.stringify(data)).toBe(before)
  })

  it('returns the original lexicon views without flattening fields or dropping metadata', () => {
    const articles = getAtmosphereArticles(fixtureData)
    expect(articles[0]).toBe(fixtureData.articles.items[0].view)
    expect(articles[1]).toBe(fixtureData.articles.items[1].view)
    expect(articles[0].publisher?.logo).toBe('https://example.com/logo.jpg')

    const photos = getAtmospherePhotos(fixtureData)
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

    expect(getAtmosphereArticles(data)).toEqual(
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
      expect(getAtmospherePublications(emptyData)).toEqual([])
    })

    it('keeps response order for equal-length descriptions, regardless of featured', () => {
      const data = withPublications([
        {featured: false, view: {...publicationView, uri: 'https://a.test/'}},
        {featured: true, view: {...publicationView, uri: 'https://b.test/'}},
        {featured: false, view: {...publicationView, uri: 'https://c.test/'}},
      ])

      expect(getAtmospherePublications(data).map(p => p.uri)).toEqual([
        'https://a.test/',
        'https://b.test/',
        'https://c.test/',
      ])
    })

    it('preserves the original publication view, including subscription metadata', () => {
      const [publication] = getAtmospherePublications(fixtureData)
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
      const [card] = getAtmospherePublications(data)

      expect(card.associatedRefs).toEqual(
        data.publications.items[0].view.associatedRefs,
      )
      expect(JSON.stringify(data)).toBe(before)
      expect(data.publications.recIdStr).toBe('1')
    })

    it('keeps publications without a logo, theme, or profiles', () => {
      const {logo, theme, subscribers, ...bare} = publicationView
      const data = withPublications([{featured: false, view: bare}])
      const [card] = getAtmospherePublications(data)

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

      const result = adapt(data)

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

    expect(getAtmosphereArticles(data).map(article => article.title)).toEqual([
      'a',
      'c',
      'd',
      'e',
      'f',
    ])
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
    expect(getAtmosphereArticles(emptyData)).toEqual([])
    expect(getAtmosphereLivestreams(emptyData)).toEqual([])
    expect(getAtmospherePhotos(emptyData)).toEqual([])

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

    expect(getAtmosphereArticles(sparseData)[0]).toBe(
      sparseData.articles.items[0].view,
    )
    expect(getAtmospherePhotos(sparseData)).toEqual([
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

    expect(getAtmospherePhotos(data)).toHaveLength(1)
    expect(getAtmosphereLivestreams(data)).toHaveLength(1)

    const invalidProfile = {
      ...data.photos.items[0].view,
      associatedProfiles: [{did: 'nope'}],
    }
    expect(
      getAtmospherePhotos({
        ...data,
        photos: {items: [{featured: true, view: invalidProfile as never}]},
      }),
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

describe('getAtmosphereExploreApps', () => {
  const valid = {
    id: 'app',
    title: 'Test app',
    url: 'https://example.com/app' as const,
    backgroundImage: 'https://example.com/bg.jpg' as const,
  }

  it.each(['id', 'title', 'url', 'backgroundImage'] as const)(
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
