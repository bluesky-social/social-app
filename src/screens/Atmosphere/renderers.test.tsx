import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {sanitizeHandle} from '#/lib/strings/handles'
import {BookmarkFilled} from '#/components/icons/Bookmark'
import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilledIcon} from '#/components/icons/Heart2'
import {matchStandardSitePublisher} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {type app} from '#/lexicons'
import {ActivityPresentationRow} from './components/ActivityPresentationRow'
import {atmospherePresentationConfig} from './config'
import {type ActivityPresentationItem} from './presentation'
import {getActivityRowKind} from './rowLayout'
import {
  createActivity,
  createActor,
  createDocumentRecords,
  createRecord,
  createRow,
  createShareRecord,
  createShareView,
  documentUri,
  present,
  publicationUri,
  recordCid,
} from './testFixtures'
import {activityCollections, type ActivityItem} from './types'

const mockAvatarStack = jest.fn()
const mockLink = jest.fn((_props: Record<string, unknown>) => {})
const mockMenu = jest.fn()
const mockShareSnippets = jest.fn(
  (
    _props: React.ComponentProps<
      typeof import('./components/ShareSnippets').ShareSnippets
    >,
  ) => {},
)
const mockGallery = jest.fn(
  (
    _props: React.ComponentProps<
      typeof import('#/components/images/Gallery').Gallery
    >,
  ) => {},
)
const mockAutoSizedImage = jest.fn(
  (
    _props: React.ComponentProps<
      typeof import('#/components/images/AutoSizedImage').AutoSizedImage
    >,
  ) => {},
)
const mockImageContextMenu = jest.fn(
  (
    _props: React.ComponentProps<
      typeof import('#/components/Post/Embed/ImageContextMenu').ImageContextMenu
    >,
  ) => {},
)
const mockOpenLightbox = jest.fn(
  (_props: Omit<import('#/components/Lightbox/state').Lightbox, 'id'>) => {},
)
const mockPublicationCard = jest.fn()
const mockSubscribeButton = jest.fn(
  (_props: {view: app.bsky.embed.external.ViewExternal}) => {},
)

jest.unmock('multiformats/cid')
jest.mock('expo-image', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Image: (props: object) => <View {...props} />}
})
jest.mock('./debug', () => ({
  ...jest.requireActual('./debug'),
  isAtmosphereDebugEnabled: () => true,
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {},
    {
      get: (_, atom) => (atom === 'font_semi_bold' ? {fontWeight: '600'} : {}),
    },
  ),
  tokens: {borderRadius: {md: 12}},
  web: (styles: object) => styles,
  useTheme: () => ({
    palette: {
      primary_500: '#006aff',
      positive_500: '#168a45',
      negative_500: '#d9003c',
      white: '#ffffff',
    },
    atoms: {
      border_contrast_low: {},
      text: {color: '#111111'},
      text_contrast_medium: {color: '#667788'},
      text_inverted: {color: '#ffffff'},
      bg: {backgroundColor: '#ffffff'},
      bg_contrast_25: {backgroundColor: '#f9fafb'},
    },
  }),
}))
jest.mock('#/components/AvatarStack', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    AvatarStack: (props: unknown) => {
      mockAvatarStack(props)
      return <View testID="avatars" />
    },
  }
})
jest.mock('#/components/images/Gallery', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Gallery: (
      props: React.ComponentProps<
        typeof import('#/components/images/Gallery').Gallery
      >,
    ) => {
      mockGallery(props)
      return <View testID="gallery" />
    },
    GalleryBleed: ({children}: React.PropsWithChildren) => <>{children}</>,
  }
})
jest.mock('#/components/images/AutoSizedImage', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    AutoSizedImage: (
      props: React.ComponentProps<
        typeof import('#/components/images/AutoSizedImage').AutoSizedImage
      >,
    ) => {
      mockAutoSizedImage(props)
      return <View testID="auto-sized-image" />
    },
  }
})
jest.mock('#/components/Post/Embed/ImageContextMenu', () => ({
  ImageContextMenu: (
    props: React.ComponentProps<
      typeof import('#/components/Post/Embed/ImageContextMenu').ImageContextMenu
    >,
  ) => {
    mockImageContextMenu(props)
    return <>{props.children}</>
  },
}))
jest.mock('#/components/Lightbox/state', () => ({
  useLightboxControls: () => ({openLightbox: mockOpenLightbox}),
}))
jest.mock('#/components/Button', () => {
  const {Pressable, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
      testID,
    }: React.PropsWithChildren<{
      label: string
      onPress: () => void
      testID?: string
    }>) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => <View />,
  }
})
jest.mock('#/components/Link', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    InlineLinkText: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      mockLink({children, ...props})
      return <Text {...props}>{children}</Text>
    },
    Link: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      mockLink({children, ...props})
      return <View {...props}>{children}</View>
    },
  }
})
jest.mock('./components/DocumentMenu', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    DocumentMenu: (props: unknown) => {
      mockMenu(props)
      return <View testID="article-menu" />
    },
    DocumentMenuPlaceholder: () => (
      <View
        testID="atmosphereDocumentMenuPlaceholder"
        style={{width: 1, height: 25}}
      />
    ),
  }
})
jest.mock('./components/ShareSnippets', () => {
  const {View, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ShareSnippets: (
      props: React.ComponentProps<
        typeof import('./components/ShareSnippets').ShareSnippets
      >,
    ) => {
      mockShareSnippets(props)
      return (
        <View testID="share-snippets">
          {props.shares.map(({activity}) => {
            const record = props.associatedRecords[activity.record.uri]?.record
            return (
              <Text key={activity.record.uri}>
                {typeof record?.text === 'string' ? record.text : ''}
              </Text>
            )
          })}
        </View>
      )
    },
  }
})
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PublicationCard: (props: unknown) => {
      mockPublicationCard(props)
      return <View testID="publication-card" />
    },
    SubscribeButton: (props: {view: app.bsky.embed.external.ViewExternal}) => {
      mockSubscribeButton(props)
      return <View testID="publication-cta" />
    },
  }
})
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    children,
    timestamp,
  }: {
    timestamp: string
    children: (value: {timeElapsed: string}) => React.ReactNode
  }) => children({timeElapsed: `elapsed:${timestamp}`}),
}))

i18n.loadAndActivate({locale: 'en', messages: {}})
beforeEach(() => {
  jest.clearAllMocks()
})
afterEach(() => {
  atmospherePresentationConfig.recommendationCardThreshold = 2
  atmospherePresentationConfig.subscriptionCardThreshold = 2
})

function renderRow(item: ActivityPresentationItem) {
  const props = present(item)
  const screen = render(
    <I18nProvider i18n={i18n}>
      <ActivityPresentationRow {...props} hideTopBorder={false} />
    </I18nProvider>,
  )
  const kind = getActivityRowKind(props)
  if (kind) {
    const hasCard = [
      'atmosphereArticleCard',
      'atmosphereSubscriptionCard',
      'atmosphereShareCard',
      'atmosphereActiveLivestream',
      'atmospherePhotoCard',
      'publication-card',
    ].some(id => screen.queryAllByTestId(id).length > 0)
    expect(hasCard).toBe(kind === 'card')
  }
  expect(screen.getAllByTestId('atmosphereDebugButton')).toHaveLength(1)
  return screen
}

function recommend(did: string, rkey = 'recommend') {
  return createActivity({
    collection: activityCollections.recommendation,
    did,
    rkey,
  })
}

function recommendationRow(count = 1) {
  const activities = Array.from({length: count}, (_, i) =>
    recommend(`did:plc:actor${i}`),
  )
  const records = createDocumentRecords()
  for (const activity of activities)
    records[activity.record.uri] = createRecord(activity.record.uri, {
      document: documentUri,
      createdAt: activity.record.indexedAt,
    })
  const row = createRow(activities, {associatedRecords: records})
  row.actors['did:plc:author'] = createActor()
  return row
}

function documentRow(subscribed = false, relatedActivity: ActivityItem[] = []) {
  const associatedRecords = createDocumentRecords()
  const actors = {'did:plc:author': createActor()}
  for (const activity of relatedActivity) {
    associatedRecords[activity.record.uri] = createRecord(
      activity.record.uri,
      activity.collection === activityCollections.share
        ? createShareRecord()
        : {document: documentUri, createdAt: activity.record.indexedAt},
    )
    Object.assign(actors, createRow([activity]).actors)
  }
  return createRow([createActivity({subscribed, relatedActivity})], {
    associatedRecords,
    actors,
  })
}

function hasLink(to: string) {
  expect(mockLink.mock.calls.map(([props]) => props)).toEqual(
    expect.arrayContaining([expect.objectContaining({to})]),
  )
}

describe('content-first articles and recommendations', () => {
  it.each([false, true])(
    'renders a root document as a card only when subscribed=%s',
    subscribed => {
      const screen = renderRow(documentRow(subscribed))
      expect(Boolean(screen.queryByTestId('atmosphereArticleCard'))).toBe(
        subscribed,
      )
      expect(Boolean(screen.queryByTestId('atmosphereFootnote'))).toBe(
        !subscribed,
      )
      expect(screen.getByText('An article')).toBeTruthy()
      hasLink('https://publication.example/')
      hasLink('/profile/author.example')
      expect(
        screen.getByTestId('atmosphereDocumentMenuPlaceholder'),
      ).toHaveStyle({width: 1, height: 25})
      expect(mockMenu).not.toHaveBeenCalled()
    },
  )

  it.each([
    [
      'https://writer.leaflet.pub',
      'Leaflet',
      Leaflet,
      'https://bsky.app/profile/leaflet.pub',
    ],
    [
      'https://writer.pckt.blog',
      'pckt',
      Pckt,
      'https://bsky.app/profile/pckt.blog',
    ],
    [
      'https://offprint.app',
      'Offprint',
      Offprint,
      'https://bsky.app/profile/offprint.app',
    ],
  ])(
    'shows the %s publication URL as a via icon linked to its Bluesky profile',
    (url, name, Icon, profileUrl) => {
      const row = documentRow(true)
      row.associatedRecords[publicationUri].record.url = url
      const screen = renderRow(row)
      expect(screen.getByLabelText(`via ${name}`)).toBeTruthy()
      expect(screen.UNSAFE_getByType(Icon)).toBeTruthy()
      expect(
        screen.getByTestId('atmosphereArticlePublisherIcon').props.width,
      ).toBe(12)
      expect(mockLink).toHaveBeenCalledWith(
        expect.objectContaining({
          testID: 'atmosphereArticlePublisher',
          to: profileUrl,
        }),
      )
    },
  )

  it.each([
    [
      'pub.leaflet.theme#basic',
      'Leaflet',
      Leaflet,
      'https://bsky.app/profile/leaflet.pub',
    ],
    [
      'blog.pckt.theme#basic',
      'pckt',
      Pckt,
      'https://bsky.app/profile/pckt.blog',
    ],
    [
      'app.offprint.theme#basic',
      'Offprint',
      Offprint,
      'https://bsky.app/profile/offprint.app',
    ],
  ])(
    'uses the %s theme NSID as a publisher hint',
    ($type, name, Icon, profileUrl) => {
      const row = documentRow(true)
      row.associatedRecords[publicationUri].record.url =
        'https://custom-domain.example'
      row.associatedRecords[publicationUri].record.basicTheme = {$type}
      const screen = renderRow(row)
      expect(screen.getByLabelText(`via ${name}`)).toBeTruthy()
      expect(screen.UNSAFE_getByType(Icon)).toBeTruthy()
      expect(mockLink).toHaveBeenCalledWith(
        expect.objectContaining({
          testID: 'atmosphereArticlePublisher',
          to: profileUrl,
        }),
      )
    },
  )

  it('prefers publication URL evidence over a conflicting theme hint', () => {
    const row = documentRow(true)
    row.associatedRecords[publicationUri].record.url =
      'https://writer.pckt.blog'
    row.associatedRecords[publicationUri].record.basicTheme = {
      $type: 'pub.leaflet.theme#basic',
    }
    const screen = renderRow(row)
    expect(screen.getByLabelText('via pckt')).toBeTruthy()
    expect(screen.UNSAFE_getByType(Pckt)).toBeTruthy()
    expect(screen.queryByLabelText('via Leaflet')).toBeNull()
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        testID: 'atmosphereArticlePublisher',
        to: 'https://bsky.app/profile/pckt.blog',
      }),
    )
  })

  it('omits via branding for unknown and lookalike publisher hints', () => {
    const row = documentRow(true)
    row.associatedRecords[publicationUri].record.url =
      'https://leaflet.pub.evil.example'
    row.associatedRecords[publicationUri].record.basicTheme = {
      $type: 'evilblog.pckt.theme#basic',
    }
    const screen = renderRow(row)
    expect(screen.queryByTestId('atmosphereArticlePublisher')).toBeNull()
  })

  it.each([1, 2, 3])(
    'uses default recommendation threshold with %s usable actors',
    count => {
      const screen = renderRow(recommendationRow(count))
      expect(Boolean(screen.queryByTestId('atmosphereArticleCard'))).toBe(
        count >= 2,
      )
      expect(Boolean(screen.queryByTestId('atmosphereFootnote'))).toBe(
        count < 2,
      )
      const others =
        count > 1 ? ` and ${count - 1} ${count === 2 ? 'other' : 'others'}` : ''
      expect(
        screen.getByLabelText(
          new RegExp(
            `${sanitizeHandle('actor0.example', '@')}${others} recommended`,
          ),
        ),
      ).toBeTruthy()
    },
  )

  it('renders recommendation footnotes as one linked sentence with full-contrast links', () => {
    const row = recommendationRow(1)
    row.associatedRecords[publicationUri].record.url =
      'https://writer.pckt.blog'
    const screen = renderRow(row)

    expect(screen.getByTestId('atmosphereFootnoteText')).toHaveTextContent(
      /recommended An article via pckt/,
    )
    expect(screen.getByTestId('atmosphereFootnoteText')).toHaveStyle({
      color: '#667788',
    })
    expect(screen.getByTestId('atmosphereFootnoteActor')).toHaveStyle({
      color: '#111111',
    })
    expect(screen.getByTestId('atmosphereFootnoteTitle')).toHaveStyle({
      color: '#111111',
    })
    expect(screen.getByTestId('atmosphereFootnoteApp')).toHaveStyle({
      color: '#111111',
      fontWeight: '600',
    })
    expect(screen.getByTestId('atmosphereFootnoteApp').props.to).toBe(
      'https://bsky.app/profile/pckt.blog',
    )
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        profiles: [row.actors['did:plc:actor0']],
        size: 16,
      }),
    )
  })

  it.each([1, 2])(
    'uses the filled primary heart for recommendation %s-actor presentation',
    count => {
      const screen = renderRow(recommendationRow(count))
      const icon = screen.UNSAFE_getByType(HeartFilledIcon)
      expect(icon.props.fill).toBe('#006aff')
    },
  )

  it.each([false, true])(
    'uses the filled primary heart for related proof in card=%s presentation',
    subscribed => {
      const screen = renderRow(
        documentRow(subscribed, [recommend('did:plc:one')]),
      )
      const icon = screen.UNSAFE_getByType(HeartFilledIcon)
      expect(icon.props.fill).toBe('#006aff')
    },
  )

  it('applies configuration to both recommendation groups and related proof', () => {
    atmospherePresentationConfig.recommendationCardThreshold = 3
    const cluster = renderRow(recommendationRow(2))
    expect(cluster.queryByTestId('atmosphereArticleCard')).toBeNull()
    cluster.unmount()
    const document = renderRow(
      documentRow(false, [recommend('did:plc:one'), recommend('did:plc:two')]),
    )
    expect(document.queryByTestId('atmosphereArticleCard')).toBeNull()
  })

  it.each([false, true])('ignores target-author following=%s', following => {
    const row = recommendationRow()
    row.actors['did:plc:author'].viewer = following
      ? {following: 'at://did:plc:viewer/app.bsky.graph.follow/author'}
      : undefined
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
    expect(screen.getByText('An article')).toBeTruthy()
  })

  it('bounds the avatar stack to five and counts distinct usable actors in API order', () => {
    const row = recommendationRow(8)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items.push(row.group.items[0])
    delete row.actors['did:plc:actor6']
    row.actors['did:plc:actor7'].handle = 'handle.invalid'
    const screen = renderRow(row)
    expect(
      screen.getByLabelText(
        `${sanitizeHandle('actor0.example', '@')} and 5 others recommended`,
      ),
    ).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: 16,
        profiles: [0, 1, 2, 3, 4].map(i => row.actors[`did:plc:actor${i}`]),
      }),
    )
    expect(screen.queryByText(/actor6|actor7|did:plc:/)).toBeNull()
  })

  it.each([1, 2, 3])(
    'promotes related recommendation proof at the same default threshold (%s)',
    count => {
      const screen = renderRow(
        documentRow(
          false,
          Array.from({length: count}, (_, i) => recommend(`did:plc:rec${i}`)),
        ),
      )
      expect(Boolean(screen.queryByTestId('atmosphereArticleCard'))).toBe(
        count >= 2,
      )
    },
  )

  it('promotes mixed and self-share proof without labeling shares as recommendations', () => {
    const selfShare = createActivity({collection: activityCollections.share})
    const screen = renderRow(
      documentRow(false, [recommend('did:plc:one'), selfShare]),
    )
    expect(screen.getByTestId('atmosphereArticleCard')).toBeTruthy()
    expect(
      screen.getByLabelText(
        `${sanitizeHandle('one.example', '@')} recommended`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/and 1 other|and 2 others/)).toBeNull()
    expect(
      screen.queryByLabelText(
        `${sanitizeHandle('author.example', '@')} recommended`,
      ),
    ).toBeNull()
    screen.unmount()
    const selfOnly = renderRow(documentRow(false, [selfShare]))
    expect(selfOnly.getByTestId('atmosphereArticleCard')).toBeTruthy()
    expect(selfOnly.queryByText(/recommended/)).toBeNull()
  })

  it.each([activityCollections.document, activityCollections.recommendation])(
    'bounds 15-item actor groups to the first title plus count (%s)',
    collection => {
      const activities = Array.from({length: 15}, (_, i) =>
        createActivity({collection, rkey: String(i), subscribed: true}),
      )
      const records = createDocumentRecords()
      const lateProof = recommend('did:plc:late')
      records[lateProof.record.uri] = createRecord(lateProof.record.uri, {
        document: `at://did:plc:author/site.standard.document/1`,
        createdAt: lateProof.record.indexedAt,
      })
      for (const [i, activity] of activities.entries()) {
        const uri = `at://did:plc:author/site.standard.document/${i}`
        records[uri] = createRecord(uri, {
          title: `Article ${i}`,
          site: publicationUri,
          path: `/article-${i}`,
          publishedAt: '2026-09-10T00:00:00Z',
        })
        if (collection === activityCollections.recommendation)
          records[activity.record.uri] = createRecord(activity.record.uri, {
            document: uri,
            createdAt: activity.record.indexedAt,
          })
      }
      activities[1].relatedActivity = [lateProof]
      const row = createRow(activities, {
        groupBy: 'actor',
        associatedRecords: records,
      })
      row.actors['did:plc:late'] = createActor('did:plc:late')
      const screen = renderRow(row)
      expect(screen.getByText(/^Article 0/)).toBeTruthy()
      expect(screen.getByText(/and 14 more articles/)).toBeTruthy()
      expect(screen.queryByText('Article 1')).toBeNull()
      expect(screen.queryByText(/late.example|and 14 others/)).toBeNull()
      expect(Boolean(screen.queryByTestId('atmosphereArticleCard'))).toBe(
        collection === activityCollections.document,
      )
      expect(row.type === 'group' && row.group.items).toHaveLength(15)
    },
  )

  it('does not select a later actor-group article when the first is unavailable', () => {
    const row = createRow(
      [
        createActivity({rkey: 'missing', subscribed: true}),
        createActivity({subscribed: true}),
      ],
      {groupBy: 'actor', associatedRecords: createDocumentRecords()},
    )
    const screen = renderRow(row)
    expect(screen.getByText(/^Article unavailable/)).toBeTruthy()
    expect(screen.queryByText('An article')).toBeNull()
    expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
    expect(screen.getByText(/and 1 more article/)).toBeTruthy()
  })

  it('uses outer timestamps rather than publication time or hidden child timestamps', () => {
    const row = createRow([createActivity(), createActivity({rkey: 'other'})], {
      groupBy: 'actor',
      associatedRecords: createDocumentRecords(),
    })
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.indexedAt = '2026-09-09T05:00:00Z'
    const screen = renderRow(row)
    expect(
      screen.getByLabelText(
        `${sanitizeHandle('author.example', '@')} published · elapsed:2026-09-09T05:00:00Z`,
      ),
    ).toBeTruthy()
  })

  it.each(['card', 'footnote'])(
    'omits missing media and renders actual covers for a %s',
    kind => {
      const row = documentRow(kind === 'card')
      const screen = renderRow(row)
      expect(screen.queryByTestId('atmosphereArticleCover')).toBeNull()
      expect(screen.queryByTestId('atmosphereFootnoteThumbnail')).toBeNull()
      screen.unmount()
      row.associatedRecords[documentUri].record.coverImage = {
        ref: {$link: 'bafycover'},
        mimeType: 'image/jpeg',
      }
      const withCover = renderRow(row)
      const image = withCover.getByTestId(
        kind === 'card'
          ? 'atmosphereArticleCover'
          : 'atmosphereFootnoteThumbnail',
      )
      expect(image.props.source).toEqual({
        uri: 'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:author/bafycover@jpeg',
      })
    },
  )

  it.each([
    '',
    'javascript:alert(1)',
    'at://did:plc:missing/site.standard.publication/site',
  ])(
    'degrades missing/unsafe site URL %s to a non-linked title without a card',
    site => {
      const row = documentRow(true)
      row.associatedRecords[documentUri].record.site = site
      const screen = renderRow(row)
      expect(screen.getByText('An article')).toBeTruthy()
      expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
      expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
      expect(mockMenu).not.toHaveBeenCalled()
      expect(mockLink.mock.calls.map(([props]) => props.to)).toEqual([
        '/profile/author.example',
      ])
    },
  )

  it('preserves long emoji/RTL titles and renders preview without reading-time metadata', () => {
    const row = documentRow(true)
    const title = 'مرحبا 🌌 '.repeat(30)
    row.associatedRecords[documentUri].record.title = title
    row.associatedRecords[documentUri].record.textContent = 'Actual preview'
    const screen = renderRow(row)
    expect(screen.getByText(title.trim())).toBeTruthy()
    expect(screen.getByText('Actual preview')).toBeTruthy()
    expect(screen.queryByText(/min read|last hour|214 follows/)).toBeNull()
  })

  it('does not fabricate a missing document author for recommendation cards', () => {
    const row = recommendationRow(2)
    delete row.actors['did:plc:author']
    renderRow(row)
    expect(mockMenu).not.toHaveBeenCalled()
    expect(
      mockLink.mock.calls.some(
        ([props]) => props.to === '/profile/author.example',
      ),
    ).toBe(false)
  })

  it('keeps one debug control per outer row with reachable original objects', () => {
    const row = documentRow(true, [recommend('did:plc:one')])
    row.associatedRecords.unrelated = createRecord('unrelated', {})
    const log = jest.spyOn(console, 'log').mockImplementation()
    const screen = renderRow(row)
    expect(screen.getAllByTestId('atmosphereDebugButton')).toHaveLength(1)
    fireEvent.press(screen.getByTestId('atmosphereDebugButton'))
    const logged = log.mock.calls[0][0] as ActivityPresentationItem
    expect(logged.associatedRecords[documentUri]).toBe(
      row.associatedRecords[documentUri],
    )
    expect(logged.associatedRecords[publicationUri]).toBe(
      row.associatedRecords[publicationUri],
    )
    expect(logged.actors['did:plc:one']).toBe(row.actors['did:plc:one'])
    expect(logged.associatedRecords.unrelated).toBeUndefined()
    log.mockRestore()
  })
})

function subscriptionRow(count = 1) {
  const activities = Array.from({length: count}, (_, i) =>
    createActivity({
      collection: activityCollections.subscription,
      did: `did:plc:subscriber${i}`,
    }),
  )
  const associatedRecords = createDocumentRecords()
  for (const activity of activities)
    associatedRecords[activity.record.uri] = createRecord(activity.record.uri, {
      publication: publicationUri,
    })
  const row = createRow(activities, {associatedRecords})
  if (row.type === 'group') row.group.subject = publicationUri
  row.actors['did:plc:publisher'] = createActor('did:plc:publisher')
  return row
}

describe('subscription social proof', () => {
  it.each([1, 2, 3])(
    'uses the configured default boundary with %s subscribers',
    count => {
      const screen = renderRow(subscriptionRow(count))
      expect(Boolean(screen.queryByTestId('atmosphereSubscriptionCard'))).toBe(
        count >= 2,
      )
      expect(Boolean(screen.queryByTestId('atmosphereFootnote'))).toBe(
        count < 2,
      )
      expect(Boolean(screen.queryByTestId('publication-cta'))).toBe(count >= 2)
      expect(screen.getByText('A publication')).toBeTruthy()
      hasLink('https://publication.example/')
      hasLink('/profile/subscriber0.example')
      expect(
        screen.getByTestId('atmosphereDocumentMenuPlaceholder'),
      ).toHaveStyle({width: 1, height: 25})
      expect(mockMenu).not.toHaveBeenCalled()
    },
  )

  it.each([1, 2])(
    'uses the filled green bookmark for subscription %s-actor presentation',
    count => {
      const screen = renderRow(subscriptionRow(count))
      const icon = screen.UNSAFE_getByType(BookmarkFilled)
      expect(icon.props.fill).toBe('#168a45')
    },
  )

  it('uses an independent subscription threshold and ignores viewer subscription on interaction rows', () => {
    atmospherePresentationConfig.subscriptionCardThreshold = 3
    const screen = renderRow(subscriptionRow(2))
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    screen.unmount()
    atmospherePresentationConfig.recommendationCardThreshold = 1
    const single = subscriptionRow()
    if (single.type !== 'activity') throw new Error('Expected activity')
    single.activity.viewerState.subscribed = true
    expect(
      renderRow(single).queryByTestId('atmosphereSubscriptionCard'),
    ).toBeNull()
  })

  it('counts only distinct usable subscribers and bounds their avatars', () => {
    const row = subscriptionRow(8)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items.push(row.group.items[0])
    delete row.actors['did:plc:subscriber6']
    row.actors['did:plc:subscriber7'].handle = 'handle.invalid'
    const screen = renderRow(row)
    expect(
      screen.getByLabelText(
        `${sanitizeHandle('subscriber0.example', '@')} and 5 others subscribed`,
      ),
    ).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: 16,
        profiles: [0, 1, 2, 3, 4].map(
          i => row.actors[`did:plc:subscriber${i}`],
        ),
      }),
    )
    for (const i of [1, 2, 3, 4, 5]) delete row.actors[`did:plc:subscriber${i}`]
    screen.unmount()
    const reduced = renderRow(row)
    expect(reduced.queryByTestId('atmosphereSubscriptionCard')).toBeNull()
    expect(reduced.queryByText(/others subscribed/)).toBeNull()
  })

  it('summarizes ten different-publication subscriptions by one actor with first title and remaining count', () => {
    const activities = Array.from({length: 10}, (_, i) =>
      createActivity({
        collection: activityCollections.subscription,
        rkey: String(i),
      }),
    )
    const associatedRecords = createDocumentRecords()
    for (const [i, activity] of activities.entries()) {
      const target = `${publicationUri}-${i}`
      associatedRecords[activity.record.uri] = createRecord(
        activity.record.uri,
        {publication: target},
      )
      associatedRecords[target] = createRecord(target, {
        name: `Publication ${i}`,
        url: `https://publication-${i}.example`,
      })
    }
    const row = createRow(activities, {groupBy: 'actor', associatedRecords})
    const screen = renderRow(row)
    expect(screen.getByText(/^Publication 0/)).toBeTruthy()
    expect(screen.getByText(/and 9 more publications/)).toBeTruthy()
    expect(screen.queryByText('Publication 1')).toBeNull()
    expect(screen.queryByTestId('atmosphereSubscriptionCard')).toBeNull()
    expect(screen.queryByTestId('publication-cta')).toBeNull()
    expect(screen.queryByText(/others subscribed/)).toBeNull()
    expect(row.type === 'group' && row.group.items).toHaveLength(10)
    screen.unmount()
    delete row.associatedRecords[`${publicationUri}-0`]
    const missingFirst = renderRow(row)
    expect(missingFirst.getByText(/^Publication unavailable/)).toBeTruthy()
    expect(missingFirst.queryByText('Publication 1')).toBeNull()
  })

  it.each([
    '',
    'javascript:alert(1)',
    'at://did:plc:publisher/site.standard.publication/site',
  ])('does not render a card or CTA for invalid publication URL %s', url => {
    const row = subscriptionRow(2)
    row.associatedRecords[publicationUri].record.url = url
    const screen = renderRow(row)
    expect(screen.getByText('A publication')).toBeTruthy()
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereSubscriptionCard')).toBeNull()
    expect(mockSubscribeButton).not.toHaveBeenCalled()
    expect(mockMenu).not.toHaveBeenCalled()
    expect(
      mockLink.mock.calls.every(([props]) =>
        String(props.to).startsWith('/profile/'),
      ),
    ).toBe(true)
  })

  it('omits the menu and CTA when neither a publication URL nor author is available', () => {
    const row = subscriptionRow(2)
    row.associatedRecords[publicationUri].record.url = ''
    delete row.actors['did:plc:publisher']
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    expect(mockMenu).not.toHaveBeenCalled()
    expect(mockSubscribeButton).not.toHaveBeenCalled()
  })

  it('omits absent icons/author and preserves real icon blobs and long names', () => {
    const row = subscriptionRow(2)
    delete row.actors['did:plc:publisher']
    const screen = renderRow(row)
    expect(screen.queryByTestId('atmospherePublicationIcon')).toBeNull()
    expect(screen.queryByText(/by @/)).toBeNull()
    expect(mockMenu).not.toHaveBeenCalled()
    screen.unmount()
    const name = 'مرحبا 🌐 '.repeat(30)
    row.associatedRecords[publicationUri].record.name = name
    row.associatedRecords[publicationUri].record.icon = {
      ref: {$link: 'bafyicon'},
      mimeType: 'image/png',
    }
    row.associatedRecords[publicationUri].record.description =
      'Real description'
    const withIcon = renderRow(row)
    expect(withIcon.getByText(name.trim()).props.numberOfLines).toBe(3)
    expect(withIcon.getByText('Real description')).toBeTruthy()
    expect(
      withIcon.getByTestId('atmospherePublicationIcon').props.source,
    ).toEqual({
      uri: 'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:publisher/bafyicon@png',
    })
  })

  it.each([
    ['https://paul.leaflet.pub', 'Leaflet'],
    ['https://writer.pckt.blog', 'pckt'],
    ['https://offprint.app', 'Offprint'],
    ['https://publication.example', undefined],
    ['https://notleaflet.pub', undefined],
    ['https://leaflet.pub.evil.example', undefined],
  ])(
    'passes the real external view to the existing contrast-safe CTA (%s)',
    (url, publisher) => {
      const row = subscriptionRow(2)
      row.associatedRecords[publicationUri].record.url = url
      row.associatedRecords[publicationUri].record.basicTheme = {
        accent: {$type: 'site.standard.theme#rgb', r: 10, g: 20, b: 30},
        accentForeground: {
          $type: 'site.standard.theme#rgb',
          r: 255,
          g: 255,
          b: 255,
        },
      }
      renderRow(row)
      const {view} = mockSubscribeButton.mock.calls[0][0]
      expect(view.uri).toBe(`${url}/`)
      expect(view.source?.uri).toBe(`${url}/`)
      expect(view.source?.theme).toEqual(
        expect.objectContaining({
          accentRGB: {r: 10, g: 20, b: 30},
          accentForegroundRGB: {r: 255, g: 255, b: 255},
        }),
      )
      expect(matchStandardSitePublisher(view)?.name).toBe(publisher)
      hasLink('/profile/publisher.example')
      hasLink('/profile/subscriber0.example')
    },
  )
})

function shareRow(count = 1, recordWithMedia = false) {
  const activities = Array.from({length: count}, (_, i) =>
    createActivity({
      collection: activityCollections.share,
      did: `did:plc:sharer${i}`,
      view: createShareView({
        likeCount: i + 1,
        repostCount: i + 2,
        replyCount: i + 3,
      }),
    }),
  )
  const associatedRecords = createDocumentRecords()
  for (const [i, activity] of activities.entries()) {
    associatedRecords[activity.record.uri] = createRecord(activity.record.uri, {
      ...createShareRecord(documentUri, recordWithMedia),
      text: `Commentary ${i}`,
    })
  }
  const row = createRow(activities, {associatedRecords})
  row.actors['did:plc:author'] = createActor()
  return row
}

describe('document share cards', () => {
  it.each([false, true])(
    'renders a standalone external share (record-with-media=%s)',
    recordWithMedia => {
      const row = shareRow(1, recordWithMedia)
      const screen = renderRow(row)
      expect(screen.getByTestId('atmosphereShareRow')).toBeTruthy()
      expect(screen.getByTestId('atmosphereShareCard')).toBeTruthy()
      expect(screen.getAllByText('An article')).toHaveLength(1)
      expect(screen.getByText('Commentary 0')).toBeTruthy()
      expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
      expect(
        screen.queryByTestId('atmosphereShareDocumentThumbnail'),
      ).toBeNull()
      hasLink('https://publication.example/')
      hasLink('/profile/sharer0.example')
      expect(
        screen.getByTestId('atmosphereDocumentMenuPlaceholder'),
      ).toHaveStyle({width: 1, height: 25})
      expect(mockMenu).not.toHaveBeenCalled()
      expect(mockShareSnippets).toHaveBeenCalledWith(
        expect.objectContaining({
          associatedRecords: row.associatedRecords,
          showActorMetadata: false,
          shares: [
            expect.objectContaining({
              activity: expect.objectContaining({
                view: createShareView({
                  likeCount: 1,
                  repostCount: 2,
                  replyCount: 3,
                }),
              }),
            }),
          ],
        }),
      )
      expect(
        mockLink.mock.calls.some(([props]) =>
          String(props.to).includes('quoted'),
        ),
      ).toBe(false)
    },
  )

  it('renders the publication author inline with middle ellipsis truncation', () => {
    const row = shareRow()
    const screen = renderRow(row)

    const byline = screen.getByTestId('atmosphereShareDocumentByline')
    const publication = screen.getByTestId('atmosphereShareDocumentPublication')
    const author = screen.getByTestId('atmosphereShareDocumentAuthor')

    expect(byline).toBeTruthy()
    expect(publication).toHaveTextContent('A publication')
    expect(author).toHaveTextContent(
      `by ${sanitizeHandle('author.example', '@')}`,
    )
    expect(publication.props.numberOfLines).toBe(1)
    expect(publication.props.ellipsizeMode).toBe('middle')
    expect(author.props.numberOfLines).toBe(1)
    expect(author.props.ellipsizeMode).toBe('middle')
    hasLink('/profile/author.example')
  })

  it('keeps one preview and all same-document posts for the snippet expansion', () => {
    const row = shareRow(5)
    if (row.type !== 'group') throw new Error('Expected group')
    const screen = renderRow(row)
    expect(
      screen.getAllByTestId('atmosphereShareDocumentPreview'),
    ).toHaveLength(1)
    expect(screen.getByLabelText(/and 4 others shared/)).toBeTruthy()
    const props = mockShareSnippets.mock.calls[0][0]
    expect(props.shares.map(share => share.activity)).toEqual(row.group.items)
    expect(props.shares.map(share => share.activity.view?.$type)).toEqual(
      Array(5).fill('eric.bsky.atmosphere.getActivity#shareView'),
    )
    expect(props.shares[0].activity).toBe(row.group.items[0])
    expect(props.shares[0].actor).toBe(row.actors['did:plc:sharer0'])
    expect(props.associatedRecords).toBe(row.associatedRecords)
  })

  it('counts unique people separately from their posts and ignores repeated post URIs', () => {
    const row = shareRow(3)
    if (row.type !== 'group') throw new Error('Expected group')
    const repeatedActor = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:sharer0',
      rkey: 'second',
    })
    row.group.items[2] = repeatedActor
    row.group.items.push(row.group.items[0])
    row.associatedRecords[repeatedActor.record.uri] = createRecord(
      repeatedActor.record.uri,
      createShareRecord(),
    )
    const screen = renderRow(row)
    expect(screen.getByLabelText(/and 1 other shared/)).toBeTruthy()
    expect(screen.queryByLabelText(/and 2 others shared/)).toBeNull()
    expect(mockShareSnippets.mock.calls[0][0].shares).toHaveLength(3)
  })

  it('excludes unavailable actors, invalid posts, different targets, and non-post source URIs from proof', () => {
    const row = shareRow(5)
    if (row.type !== 'group') throw new Error('Expected group')
    delete row.actors['did:plc:sharer1']
    row.associatedRecords[row.group.items[2].record.uri].record.text = 42
    row.associatedRecords[row.group.items[3].record.uri].record =
      createShareRecord(`${documentUri}-other`)
    const wrongSource = row.group.items[4]
    wrongSource.record.uri =
      'at://did:plc:sharer4/site.standard.document/not-a-post'
    row.associatedRecords[wrongSource.record.uri] = createRecord(
      wrongSource.record.uri,
      createShareRecord(),
    )
    const screen = renderRow(row)
    expect(screen.queryByLabelText(/others shared/)).toBeNull()
    expect(
      mockShareSnippets.mock.calls[0][0].shares.map(share => share.activity),
    ).toEqual([row.group.items[0]])
  })

  it('bounds different-subject actor groups to their first share and preview plus count', () => {
    const first = createActivity({collection: activityCollections.share})
    const second = createActivity({
      collection: activityCollections.share,
      rkey: 'second',
    })
    const records = createDocumentRecords()
    records[first.record.uri] = createRecord(first.record.uri, {
      ...createShareRecord(),
      text: 'First commentary',
    })
    records[second.record.uri] = createRecord(second.record.uri, {
      ...createShareRecord(`${documentUri}-other`),
      text: 'Later commentary',
    })
    records[`${documentUri}-other`] = createRecord(`${documentUri}-other`, {
      ...records[documentUri].record,
      title: 'Later article',
    })
    const row = createRow([first, second], {
      groupBy: 'actor',
      associatedRecords: records,
    })
    const screen = renderRow(row)
    expect(screen.getByText('First commentary')).toBeTruthy()
    expect(screen.getByText('and 1 more post')).toBeTruthy()
    expect(screen.queryByText('Later commentary')).toBeNull()
    expect(screen.queryByText('Later article')).toBeNull()
    expect(screen.queryByLabelText(/other shared/)).toBeNull()
    expect(mockShareSnippets.mock.calls[0][0].shares).toHaveLength(1)
    screen.unmount()
    jest.clearAllMocks()
    delete records[first.record.uri]
    const unavailable = renderRow(row)
    expect(unavailable.getByText(/^Post unavailable/)).toBeTruthy()
    expect(unavailable.queryByText('Later commentary')).toBeNull()
    expect(mockShareSnippets).not.toHaveBeenCalled()
  })

  it('retains a usable post without inventing an unavailable article or thumbnail', () => {
    const row = shareRow()
    delete row.associatedRecords[documentUri]
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereShareCard')).toBeTruthy()
    expect(screen.getByText('Article unavailable')).toBeTruthy()
    expect(screen.getByText('Commentary 0')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereShareDocumentThumbnail')).toBeNull()
    expect(
      mockLink.mock.calls.every(([props]) =>
        String(props.to).startsWith('/profile/'),
      ),
    ).toBe(true)
  })

  it('uses only actual document covers and does not link an unsafe article URL', () => {
    const row = shareRow()
    row.associatedRecords[documentUri].record.coverImage = {
      ref: {$link: 'bafycover'},
      mimeType: 'image/jpeg',
    }
    const screen = renderRow(row)
    expect(
      screen.getByTestId('atmosphereShareDocumentThumbnail').props.source,
    ).toEqual({
      uri: 'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:author/bafycover@jpeg',
    })
    screen.unmount()
    jest.clearAllMocks()
    row.associatedRecords[publicationUri].record.url = 'javascript:alert(1)'
    const unsafe = renderRow(row)
    expect(unsafe.getByText('An article')).toBeTruthy()
    expect(unsafe.queryByTestId('atmosphereShareDocumentThumbnail')).toBeNull()
    expect(
      mockLink.mock.calls.every(([props]) =>
        String(props.to).startsWith('/profile/'),
      ),
    ).toBe(true)
  })

  it('keeps mixed recommendation and self-share proof inside one parent article', () => {
    const share = createActivity({
      collection: activityCollections.share,
      view: createShareView(),
    })
    const row = documentRow(false, [
      recommend('did:plc:author'),
      recommend('did:plc:friend'),
      share,
    ])
    const screen = renderRow(row)
    expect(screen.getAllByTestId('atmosphereArticleCard')).toHaveLength(1)
    expect(screen.queryByTestId('atmosphereShareCard')).toBeNull()
    expect(screen.getByLabelText(/and 1 other recommended/)).toBeTruthy()
    const props = mockShareSnippets.mock.calls[0][0]
    expect(props.shares).toEqual([
      {activity: share, actor: row.actors['did:plc:author']},
    ])
    expect(props.shares[0].activity.view).toBe(share.view)
    expect(props.associatedRecords).toBe(row.associatedRecords)
    expect(props.hideActorMetadataForDid).toBe('did:plc:author')
  })
})

describe('stream lifecycle treatments', () => {
  function streamRow(fields: Record<string, unknown> = {}, count = 1) {
    const activities = Array.from({length: count}, (_, i) =>
      createActivity({
        collection: activityCollections.livestream,
        rkey: `stream${i}`,
      }),
    )
    const associatedRecords = Object.fromEntries(
      activities.map((activity, i) => [
        activity.record.uri,
        createRecord(activity.record.uri, {
          $type: activityCollections.livestream,
          title: i === 0 ? 'A real stream' : `Hidden stream ${i}`,
          url: `https://stream.example/real${i}`,
          createdAt: '2026-01-01T00:00:00Z',
          ...fields,
        }),
      ]),
    )
    return createRow(activities, {associatedRecords, groupBy: 'actor'})
  }

  it('keeps stale no-end records active without claiming friends are watching', () => {
    const row = streamRow({
      lastSeenAt: '2026-01-01T00:00:01Z',
      idleTimeoutSeconds: 300,
    })
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereActiveLivestream')).toBeTruthy()
    expect(screen.getByText('LIVE NOW')).toBeTruthy()
    expect(screen.getByLabelText(/author.example.*streaming/)).toBeTruthy()
    expect(screen.getByText('elapsed:2026-09-10T12:00:00.000Z')).toBeTruthy()
    expect(screen.queryByText(/watching|friends|replay/i)).toBeNull()
    expect(mockAvatarStack).not.toHaveBeenCalled()
    expect(mockMenu).not.toHaveBeenCalled()
    hasLink('https://stream.example/real0')
    hasLink('/profile/author.example')
  })

  it('uses raw lifecycle duration but outer indexed time for an ended footnote', () => {
    const row = streamRow({endedAt: '2026-01-01T00:48:59Z'})
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereEndedLivestream')).toBeTruthy()
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    expect(screen.getByText('A real stream')).toBeTruthy()
    expect(
      screen.getByLabelText(
        /streamed for 48 min.*elapsed:2026-09-10T12:00:00.000Z/,
      ),
    ).toBeTruthy()
    expect(screen.queryByText('LIVE NOW')).toBeNull()
    hasLink('https://stream.example/real0')
  })

  it.each(['', 'not a date', '2025-12-31T00:00:00Z'])(
    'keeps a present end value %s ended without an invalid duration',
    endedAt => {
      const screen = renderRow(streamRow({endedAt}))
      expect(screen.getByTestId('atmosphereEndedLivestream')).toBeTruthy()
      expect(screen.getByLabelText(/streamed · elapsed:/)).toBeTruthy()
      expect(screen.queryByLabelText(/streamed for|NaN|Infinity/)).toBeNull()
    },
  )

  it('updates duration units when the locale changes', () => {
    const screen = renderRow(streamRow({endedAt: '2026-01-01T00:48:00Z'}))
    expect(screen.getByLabelText(/streamed for 48 min/)).toBeTruthy()
    try {
      act(() => i18n.loadAndActivate({locale: 'fr', messages: {}}))
      const duration = i18n.number(48, {
        style: 'unit',
        unit: 'minute',
        unitDisplay: 'short',
      })
      expect(
        screen.getByLabelText(/streamed for/).props.accessibilityLabel,
      ).toContain(`streamed for ${duration}`)
    } finally {
      act(() => i18n.activate('en'))
    }
  })

  it('uses seconds below a minute, including a real zero duration', () => {
    const screen = renderRow(streamRow({endedAt: '2026-01-01T00:00:00Z'}))
    expect(screen.getByLabelText(/streamed for 0 sec/)).toBeTruthy()
  })

  it('bounds thirteen ended streams to the first title, count, and first duration', () => {
    const row = streamRow({endedAt: '2026-01-01T01:53:10Z'}, 13)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.indexedAt = '2026-09-11T09:00:00Z'
    for (const child of row.group.items) {
      child.view = {
        $type: 'eric.bsky.atmosphere.getActivity#livestreamView',
        thumb: 'https://cdn.example/real',
      }
    }
    const screen = renderRow(row)
    expect(screen.getAllByTestId('atmosphereFootnote')).toHaveLength(1)
    expect(
      screen.getByText(/A real stream and 12 more livestreams/),
    ).toBeTruthy()
    expect(
      screen.getByLabelText(
        /streamed \(first stream: 113 min\).*elapsed:2026-09-11T09:00:00Z/,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Hidden stream/)).toBeNull()
    expect(screen.queryByTestId('atmosphereLivestreamThumbnail')).toBeNull()
    expect(row.group.items).toHaveLength(13)
    expect(Object.keys(row.associatedRecords)).toHaveLength(13)
  })

  it('does not substitute later group content when the first record is missing', () => {
    const row = streamRow({endedAt: '2026-01-01T00:02:00Z'}, 2)
    if (row.type !== 'group') throw new Error('Expected group')
    delete row.associatedRecords[row.group.items[0].record.uri]
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereUnavailableLivestream')).toBeTruthy()
    expect(
      screen.getByText(/Livestream unavailable and 1 more livestream/),
    ).toBeTruthy()
    expect(screen.queryByText(/Hidden stream/)).toBeNull()
    expect(mockLink.mock.calls.map(([props]) => props.to)).not.toContain(
      'https://stream.example/real1',
    )
  })

  it.each([
    undefined,
    '',
    'javascript:alert(1)',
    'https://user:pass@stream.example/',
  ])('omits unavailable or unsafe stream URL %s without a dead menu', url => {
    const screen = renderRow(streamRow({title: ' ', url}))
    expect(screen.getByText('Livestream')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereLivestreamTitle')).toBeNull()
    expect(mockMenu).not.toHaveBeenCalled()
    expect(mockLink.mock.calls.map(([props]) => props.to)).toEqual([
      '/profile/author.example',
    ])
  })

  it('preserves emoji and RTL titles without truncating the underlying string', () => {
    const title = '🎥 مرحباً بالعالم '.repeat(30)
    const screen = renderRow(streamRow({title}))
    expect(screen.getByText(title.trim()).props.numberOfLines).toBe(3)
    expect(screen.getByTestId('atmosphereLivestreamTitle').props.label).toBe(
      title.trim(),
    )
  })

  it('handles malformed optional fields as unavailable content', () => {
    const screen = renderRow(streamRow({title: {invalid: true}}))
    expect(screen.getByTestId('atmosphereUnavailableLivestream')).toBeTruthy()
    expect(screen.queryByText('LIVE NOW')).toBeNull()
  })
})

describe('photo cards and shared media integration', () => {
  function photoRow(count = 1) {
    const activities = Array.from({length: count}, (_, i) =>
      createActivity({
        collection: activityCollections.grainPhoto,
        rkey: `photo${i}`,
      }),
    )
    return createRow(activities, {
      groupBy: 'actor',
      associatedRecords: Object.fromEntries(
        activities.map((activity, i) => [
          activity.record.uri,
          createRecord(activity.record.uri, {
            photo: {ref: {$link: recordCid}, mimeType: 'image/jpeg'},
            alt: `Photo ${i}`,
            aspectRatio: {width: 2, height: 3},
          }),
        ]),
      ),
    })
  }

  function imageRef() {
    return Object.assign(
      () => {
        throw new Error('Test image ref should not be invoked')
      },
      {current: null, observe: () => () => {}},
    )
  }

  it('uses the existing constrained single-image surface and real lightbox fields', () => {
    const screen = renderRow(photoRow())
    expect(screen.getByTestId('atmospherePhotoCard')).toBeTruthy()
    expect(screen.getByTestId('atmosphereSinglePhoto')).toBeTruthy()
    expect(screen.queryByTestId('atmospherePhotoGallery')).toBeNull()
    expect(screen.getByLabelText(/posted a photo/)).toBeTruthy()
    const props = mockAutoSizedImage.mock.calls[0][0]
    expect(props.crop).toBe('constrained')
    const ref = imageRef(),
      dims = {width: 400, height: 600}
    props.onPress?.(ref, dims)
    const lightbox = mockOpenLightbox.mock.calls[0][0]
    expect(lightbox.index).toBe(0)
    expect(lightbox.metricsContext).toBeUndefined()
    expect(lightbox.images).toEqual([
      {
        uri: props.image.fullsize,
        thumbUri: props.image.thumb,
        alt: 'Photo 0',
        dimensions: {width: 2, height: 3},
        thumbRect: null,
        thumbRef: ref,
        thumbDimensions: dims,
        thumbBorderRadius: 12,
        type: 'image',
      },
    ])
    expect(mockGallery).not.toHaveBeenCalled()
    expect(mockMenu).not.toHaveBeenCalled()
  })

  it('uses the captured single-image ref and dimensions for a context-menu preview', () => {
    renderRow(photoRow())
    const image = mockAutoSizedImage.mock.calls[0][0],
      menu = mockImageContextMenu.mock.calls[0][0]
    menu.onPreviewPress?.()
    expect(mockOpenLightbox).not.toHaveBeenCalled()
    const ref = imageRef(),
      dims = {width: 600, height: 900}
    image.onContainerRef?.(ref)
    image.onDimsChange?.(dims)
    menu.onPreviewPress?.()
    expect(mockOpenLightbox.mock.calls[0][0].images[0]).toEqual(
      expect.objectContaining({thumbRef: ref, thumbDimensions: dims}),
    )
    expect(menu.fullsizeUri).toBe(image.image.fullsize)
  })

  it('caps an 87-photo group at ten in Gallery and lightbox without changing raw counts', () => {
    const row = photoRow(87)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.indexedAt = '2026-09-11T09:00:00Z'
    const screen = renderRow(row)
    expect(screen.getAllByTestId('gallery')).toHaveLength(1)
    expect(
      screen.getByLabelText(/posted 87 photos.*elapsed:2026-09-11T09:00:00Z/),
    ).toBeTruthy()
    const props = mockGallery.mock.calls[0][0]
    expect(props.images).toHaveLength(10)
    expect(props.images.map(image => image.alt)).toEqual(
      Array.from({length: 10}, (_, i) => `Photo ${i}`),
    )
    expect(Object.keys(props).sort()).toEqual(['images', 'onPress'])
    props.onPress?.(9, [], [])
    const lightbox = mockOpenLightbox.mock.calls[0][0]
    expect(lightbox.images).toHaveLength(10)
    expect(lightbox.index).toBe(9)
    expect(lightbox.images[9].alt).toBe('Photo 9')
    expect(lightbox.metricsContext).toBeUndefined()
    expect(mockAutoSizedImage).not.toHaveBeenCalled()
    expect(row.group.items).toHaveLength(87)
    expect(Object.keys(row.associatedRecords)).toHaveLength(87)
  })

  it('compacts skipped images before selecting a lightbox index', () => {
    const row = photoRow(3)
    if (row.type !== 'group') throw new Error('Expected group')
    const badUri = row.group.items[1].record.uri
    row.associatedRecords[badUri] = createRecord(badUri, {
      photo: {ref: 'bad', mimeType: 'image/jpeg'},
    })
    const screen = renderRow(row)
    expect(screen.getByLabelText(/posted 3 photos/)).toBeTruthy()
    const gallery = mockGallery.mock.calls[0][0]
    expect(gallery.images.map(image => image.alt)).toEqual([
      'Photo 0',
      'Photo 2',
    ])
    const firstRef = imageRef(),
      secondRef = imageRef(),
      dims = {width: 600, height: 900}
    gallery.onPress?.(1, [firstRef, secondRef], [null, dims])
    const lightbox = mockOpenLightbox.mock.calls[0][0]
    expect(lightbox.index).toBe(1)
    expect(lightbox.images.map(image => image.alt)).toEqual([
      'Photo 0',
      'Photo 2',
    ])
    expect(lightbox.images[1].thumbRef).toBe(secondRef)
    expect(lightbox.images[1].thumbDimensions).toBe(dims)
    expect(lightbox.images[0].thumbRef).toBe(firstRef)
    expect(lightbox.metricsContext).toBeUndefined()
    expect(row.group.items).toHaveLength(3)
  })

  it('aligns the selected-only ref from Gallery screen-reader mode', () => {
    renderRow(photoRow(2))
    const ref = imageRef(),
      dims = {width: 600, height: 900}
    mockGallery.mock.calls[0][0].onPress?.(1, [ref], [dims])
    const lightbox = mockOpenLightbox.mock.calls[0][0]
    expect(lightbox.index).toBe(1)
    expect(lightbox.images[0].thumbRef).toBeNull()
    expect(lightbox.images[0].thumbDimensions).toBeNull()
    expect(lightbox.images[1].thumbRef).toBe(ref)
    expect(lightbox.images[1].thumbDimensions).toBe(dims)
  })

  it('keeps a surviving image as a singleton without changing the raw group count', () => {
    const row = photoRow(3)
    if (row.type !== 'group') throw new Error('Expected group')
    delete row.associatedRecords[row.group.items[0].record.uri]
    delete row.associatedRecords[row.group.items[2].record.uri]
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereSinglePhoto')).toBeTruthy()
    expect(screen.getByLabelText(/posted 3 photos/)).toBeTruthy()
    const image = mockAutoSizedImage.mock.calls[0][0]
    expect(image.image.alt).toBe('Photo 1')
    image.onPress?.(imageRef(), null)
    expect(mockOpenLightbox.mock.calls[0][0].index).toBe(0)
    expect(mockGallery).not.toHaveBeenCalled()
  })

  it('renders no media frame or empty card when all images are missing', () => {
    const row = photoRow(2)
    row.associatedRecords = {}
    const screen = renderRow(row)
    expect(screen.getByText('Photos unavailable')).toBeTruthy()
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    expect(screen.queryByTestId('atmospherePhotoCard')).toBeNull()
    expect(mockGallery).not.toHaveBeenCalled()
    expect(mockAutoSizedImage).not.toHaveBeenCalled()
  })

  it('keeps alt text as media metadata, not a visible caption', () => {
    const row = photoRow()
    if (row.type !== 'activity') throw new Error('Expected activity')
    const alt = '🌇 وصف الصورة - actual alt, not a caption'
    row.associatedRecords[row.activity.record.uri].record.alt = alt
    const screen = renderRow(row)
    expect(mockAutoSizedImage.mock.calls[0][0].image.alt).toBe(alt)
    expect(screen.queryByText(alt)).toBeNull()
  })
})

describe('collection dispatch and retained media boundaries', () => {
  it.each([
    [activityCollections.document, 'atmosphereDocumentRow'],
    [activityCollections.recommendation, 'atmosphereRecommendationRow'],
    [activityCollections.publication, 'atmospherePublicationRow'],
    [activityCollections.subscription, 'atmosphereSubscriptionRow'],
    [activityCollections.livestream, 'atmosphereLivestreamRow'],
    [activityCollections.grainPhoto, 'atmosphereGrainPhotoRow'],
    [activityCollections.share, 'atmosphereShareRow'],
    ['example.unknown', 'atmosphereUnknownRow'],
  ])('dispatches from API collection %s', (collection, testID) => {
    const activity = createActivity({collection})
    activity.record.uri = documentUri
    expect(renderRow(createRow([activity])).getByTestId(testID)).toBeTruthy()
  })

  it('keeps publication-root bodies and actor-group counts', () => {
    const first = createActivity({
      collection: activityCollections.publication,
      did: 'did:plc:publisher',
      rkey: 'site',
    })
    const second = createActivity({
      collection: activityCollections.publication,
      did: 'did:plc:publisher',
      rkey: 'other',
    })
    const screen = renderRow(
      createRow([first, second], {
        groupBy: 'actor',
        associatedRecords: createDocumentRecords(),
      }),
    )
    expect(screen.getByTestId('publication-card')).toBeTruthy()
    expect(screen.getByLabelText(/created 2 publications/)).toBeTruthy()
    expect(mockPublicationCard).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({uri: 'https://publication.example/'}),
      }),
    )
  })

  it('keeps Grain image ordering, aspect ratios, and real alt text', () => {
    const activities = [
      createActivity({collection: activityCollections.grainPhoto}),
      createActivity({
        collection: activityCollections.grainPhoto,
        rkey: 'second',
      }),
    ]
    const associatedRecords = Object.fromEntries(
      activities.map((activity, i) => [
        activity.record.uri,
        createRecord(activity.record.uri, {
          photo: {ref: {$link: recordCid}, mimeType: 'image/jpeg'},
          alt: `Photo ${i}`,
          aspectRatio: {width: i + 2, height: 2},
        }),
      ]),
    )
    const screen = renderRow(
      createRow(activities, {groupBy: 'actor', associatedRecords}),
    )
    expect(screen.getByTestId('atmospherePhotoGallery')).toBeTruthy()
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'via Grain',
        to: 'https://bsky.app/profile/grain.social',
      }),
    )
    const images = mockGallery.mock.calls[0][0].images
    expect(images).toHaveLength(2)
    for (const [i, image] of images.entries()) {
      expect(image.fullsize).toBe(
        `https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:author/${recordCid}@jpeg`,
      )
      expect(image.thumb).toBe(image.fullsize)
      expect(image.alt).toBe(`Photo ${i}`)
      expect(image.aspectRatio).toEqual({width: i + 2, height: 2})
    }
  })

  it('uses only appview stream thumbs, never the raw blob', () => {
    const activity = createActivity({
      collection: activityCollections.livestream,
    })
    activity.view = {
      $type: 'eric.bsky.atmosphere.getActivity#livestreamView',
      thumb: 'https://cdn.example/actual-thumb',
    }
    const associatedRecords = {
      [activity.record.uri]: createRecord(activity.record.uri, {
        createdAt: '2026-09-10T00:00:00Z',
        title: 'A stream',
        thumb: {ref: {$link: 'bafyraw'}, mimeType: 'image/jpeg'},
      }),
    }
    const screen = renderRow(createRow([activity], {associatedRecords}))
    const image = screen.getByTestId('atmosphereLivestreamThumbnail')
    expect(image.props.source).toEqual({uri: activity.view.thumb})
    expect(image.props.style).toContainEqual(
      expect.objectContaining({width: 78, height: 78}),
    )
    expect(image.props.accessible).toBe(false)
    expect(image.props.loading).toBe('lazy')
    expect(image.props.contentFit).toBe('cover')
    screen.unmount()
    const missingViews: ActivityItem['view'][] = [
      undefined,
      {$type: 'eric.bsky.atmosphere.getActivity#livestreamView'},
      {$type: 'eric.bsky.atmosphere.getActivity#livestreamView', thumb: '   '},
    ]
    for (const view of missingViews) {
      activity.view = view
      const missing = renderRow(createRow([activity], {associatedRecords}))
      expect(missing.queryByTestId('atmosphereLivestreamThumbnail')).toBeNull()
      missing.unmount()
    }
  })
})
