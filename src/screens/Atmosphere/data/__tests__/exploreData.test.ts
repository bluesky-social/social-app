import {exploreResponseFixture} from '#/screens/Atmosphere/__tests__/fixtures/exploreResponse'
import {livestreamPreviewFixture} from '#/screens/Atmosphere/__tests__/fixtures/livestreamPreview'
import {
  type AtmosphereData,
  getAtmosphereAnnouncementBanner,
  getAtmosphereApps,
  getAtmosphereArticles,
  getAtmosphereLivestreams,
  getAtmospherePhotos,
  getAtmospherePublications,
} from '#/screens/Atmosphere/data/exploreData'
import {app} from '#/lexicons'

function parseData(data: unknown): AtmosphereData {
  return app.bsky.unspecced.getAtmosphereExploreTab.$output.schema.parse(data)
}

const fixtureData = parseData(exploreResponseFixture)

const emptyData: AtmosphereData = {
  articles: {items: []},
  publications: {items: []},
  photos: {items: []},
  livestreams: {items: []},
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
    expect(getAtmosphereArticles(data).map(article => article.href)).toEqual([
      'https://example.com/first-article',
      'https://example.com/second-article',
    ])
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

  it('validates gallery images and skips malformed images at the adapter boundary', () => {
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
    'sorts %s by description length without mutating the response',
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

      expect(cards.map(card => card.id)).toEqual(
        [3, 1, 4, 5, 0, 2, 6].map(index => `https://example.com/${index}`),
      )
      expect(JSON.stringify(data)).toBe(before)
      expect(data[section].recIdStr).toBe('42')
    },
  )

  it('sorts articles with images first, then by description length', () => {
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

    expect(getAtmosphereArticles(data).map(article => article.id)).toEqual(
      [3, 5, 1, 2, 0, 4].map(index => `https://example.com/${index}`),
    )
    expect(JSON.stringify(data)).toBe(before)
  })

  it('maps populated card fields and prioritizes article images', () => {
    const articles = getAtmosphereArticles(fixtureData)
    expect(
      articles.map(({title, publisher, description}) => ({
        title,
        publisher,
        description,
      })),
    ).toEqual([
      {
        title: 'First article',
        publisher: 'Test publication',
        description: undefined,
      },
      {
        title: 'Second article',
        publisher: 'Test publication',
        description: 'An article description',
      },
    ])
    expect(articles[0]).toMatchObject({
      id: 'https://example.com/first-article',
      href: 'https://example.com/first-article',
      image: 'https://example.com/article.jpg',
      publisherAvatar: 'https://example.com/logo.jpg',
    })

    const photos = getAtmospherePhotos(fixtureData)
    expect(photos.map(({title}) => title)).toEqual([
      'First photo',
      'Second photo',
    ])
    expect(photos[0]).toMatchObject({
      id: 'https://example.com/gallery-0',
      href: 'https://example.com/gallery-0',
      image: 'https://example.com/thumbnail.jpg',
      imageAlt: 'A test photo',
      likeCount: 2,
      authorProfile: {handle: 'author.test'},
    })

    expect(getAtmosphereApps(fixtureData)).toEqual([
      {
        id: 'app',
        title: 'Test app',
        description: 'An app description',
        logo: 'https://example.com/app-logo.jpg',
        backgroundImage: 'https://example.com/app-background.jpg',
        overlayColor: '#123456',
        textColor: '#ffffff',
        href: 'https://example.com/app',
      },
    ])
    expect(getAtmosphereAnnouncementBanner(fixtureData)).toEqual({
      id: 'banner',
      title: 'Test announcement',
      description: 'An announcement description',
      image: 'https://example.com/banner.jpg',
      overlayColor: '#000000',
      textColor: '#ffffff',
      href: 'https://example.com/announcement',
    })
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

      expect(getAtmospherePublications(data).map(p => p.id)).toEqual([
        'https://a.test/',
        'https://b.test/',
        'https://c.test/',
      ])
    })

    it('builds the legacy view the shared card renders', () => {
      const [card] = getAtmospherePublications(fixtureData)

      expect(card).toMatchObject({
        id: publicationView.uri,
        title: publicationView.title,
        view: {
          uri: publicationView.uri,
          title: publicationView.title,
          description: publicationView.description,
          associatedProfiles: publicationView.associatedProfiles,
          source: {
            uri: publicationView.uri,
            title: publicationView.title,
            icon: publicationView.logo,
            theme: {
              backgroundRGB: {r: 255, g: 255, b: 255},
              foregroundRGB: {r: 0, g: 0, b: 0},
              accentRGB: {r: 0x12, g: 0x34, b: 0x56},
              accentForegroundRGB: {r: 255, g: 255, b: 255},
            },
          },
        },
      })
    })

    it('copies associated metadata and does not mutate the response', () => {
      /* Built without parsing: only the shape of the refs matters here. */
      const data: AtmosphereData = {
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

      expect(card.view.associatedRefs).toEqual(
        data.publications.items[0].view.associatedRefs,
      )
      expect(JSON.stringify(data)).toBe(before)
      expect(data.publications.recIdStr).toBe('1')
    })

    it.each([
      {
        name: 'partial',
        theme: {accent: '#fff'},
        expected: {accentRGB: {r: 255, g: 255, b: 255}},
      },
      {
        name: 'invalid',
        theme: {accent: 'red', background: '#12'},
        expected: {},
      },
    ])('converts $name theme colors', ({theme, expected}) => {
      const data = withPublications([
        {featured: true, view: {...publicationView, theme}},
      ])
      const source = getAtmospherePublications(data)[0].view.source

      expect(source?.theme).toMatchObject(expected)
      for (const key of [
        'backgroundRGB',
        'foregroundRGB',
        'accentRGB',
        'accentForegroundRGB',
      ] as const) {
        if (!(key in expected)) expect(source?.theme?.[key]).toBeUndefined()
      }
    })

    it('keeps publications without a logo, theme, or profiles', () => {
      const {logo, theme, subscribers, ...bare} = publicationView
      const data = withPublications([{featured: false, view: bare}])
      const [card] = getAtmospherePublications(data)

      expect(card.view.source?.icon).toBeUndefined()
      expect(card.view.source?.theme).toBeUndefined()
      expect(card.view.associatedProfiles).toBeUndefined()
    })
  })

  describe('dedupes items by id', () => {
    const [article] = fixtureData.articles.items
    const [photo] = fixtureData.photos.items
    const [livestream] = parseData({
      ...emptyData,
      livestreams: {items: livestreamPreviewFixture},
    }).livestreams.items
    const [publication] = fixtureData.publications.items
    const [firstApp] = fixtureData.apps

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
      expect(result.map(r => r.id).sort()).toEqual(
        [first.view.uri, second.view.uri].sort(),
      )
      expect(result.map(r => r.title)).not.toContain('duplicate')
    })

    it('in apps, keeping the first occurrence', () => {
      const data = {
        ...emptyData,
        apps: [
          firstApp,
          {...firstApp, id: 'other'},
          {...firstApp, title: 'dupe'},
        ],
      } satisfies AtmosphereData

      const result = getAtmosphereApps(data)

      expect(result.map(r => r.id)).toEqual([firstApp.id, 'other'])
      expect(result[0].title).toBe(firstApp.title)
    })
  })

  it('adapts the active and ended local livestream previews', () => {
    const previewData = parseData({
      ...emptyData,
      livestreams: {items: livestreamPreviewFixture},
    })
    const livestreams = getAtmosphereLivestreams(previewData)

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
      apps: [
        {id: 'sparse-app', title: 'Sparse app', url: 'https://example.com'},
      ],
    })

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
