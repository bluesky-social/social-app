import type * as ReactNative from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {type ImageLayoutGrid} from '#/components/images/ImageLayoutGrid'
import {type app} from '#/lexicons'
import {ActivityPresentationRow} from './components/ActivityPresentationRow'
import {getActivityPostView, getArticleExternalView} from './externalViews'
import {type ActivityPresentationItem} from './presentation'
import {getActivityRowKind} from './rowLayout'
import {
  createActivity,
  createActor,
  createArticleView,
  createGalleryView,
  createLivestreamView,
  createPostView,
  createPublicationView,
  createRow,
  createShareRecord,
  documentUri,
  present,
  publicationUri,
} from './testFixtures'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
} from './types'

const mockLink = jest.fn((_props: Record<string, unknown>) => {})
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
const mockImageLayoutGrid = jest.fn(
  (_props: React.ComponentProps<typeof ImageLayoutGrid>) => {},
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
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))
jest.mock('#/lib/haptics', () => ({
  useHaptics: () => ({tap: jest.fn(), longPress: jest.fn()}),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/view/com/util/UserAvatar', () => ({UserAvatar: () => null}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('#/components/MediaInsetBorder', () => ({
  MediaInsetBorder: () => null,
}))
jest.mock(
  '#/components/Post/Embed/StandardSiteEmbed/StandardSiteCompactDocumentCard',
  () => ({StandardSiteCompactDocumentCard: () => null}),
)
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
  utils: jest.requireActual('#/alf/util/colorGeneration'),
  web: (styles: object) => styles,
  useBreakpoints: () => ({gtPhone: true}),
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
    AvatarStack: () => <View testID="avatars" />,
  }
})
jest.mock('#/components/images/Gallery', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    GalleryBleed: ({children}: React.PropsWithChildren) => <>{children}</>,
    Gallery: (
      props: React.ComponentProps<
        typeof import('#/components/images/Gallery').Gallery
      >,
    ) => {
      mockGallery(props)
      return <View testID="gallery" />
    },
  }
})
jest.mock('#/components/images/ImageLayoutGrid', () => {
  const {View} = jest.requireActual<typeof ReactNative>('react-native')
  return {
    ImageLayoutGrid: (props: React.ComponentProps<typeof ImageLayoutGrid>) => {
      mockImageLayoutGrid(props)
      return <View testID="image-grid" />
    },
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
  const {Pressable, View, Text} =
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
    ButtonText: Text,
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
    }: {
      children?:
        React.ReactNode | ((state: {pressed: boolean}) => React.ReactNode)
      [key: string]: unknown
    }) => {
      mockLink({children, ...props})
      return (
        <View {...props}>
          {typeof children === 'function'
            ? children({pressed: false})
            : children}
        </View>
      )
    },
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
            const {getActivityPostView: getPost} =
              jest.requireActual<typeof import('./externalViews')>(
                './externalViews',
              )
            const record = getPost(activity)?.record
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
    ...jest.requireActual('#/components/Post/Embed/StandardSiteEmbed'),
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
jest.mock('./components/ActivityMenu', () => ({ActivityMenu: () => null}))

i18n.loadAndActivate({locale: 'en', messages: {}})
beforeEach(() => {
  jest.clearAllMocks()
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
      'atmosphereEndedLivestream',
      'atmospherePhotoCard',
      'publication-card',
    ].some(id => screen.queryAllByTestId(id).length > 0)
    expect(hasCard).toBe(kind === 'card')
  }
  expect(screen.getAllByTestId('atmosphereDebugButton')).toHaveLength(1)
  return screen
}

function hasLink(to: string) {
  expect(mockLink.mock.calls.map(([props]) => props)).toEqual(
    expect.arrayContaining([expect.objectContaining({to})]),
  )
}

function recommend(did: ActivityActor['did'], rkey = 'recommend') {
  return createActivity({
    collection: activityCollections.recommendation,
    did,
    rkey,
    view: createArticleView(),
  })
}

function recommendationRow(count = 1) {
  return createRow(
    Array.from({length: count}, (_, i) => recommend(`did:plc:actor${i}`)),
  )
}

function documentRow(subscribed = false, relatedActivity: ActivityItem[] = []) {
  return createRow([createActivity({subscribed, relatedActivity})], {
    actors: Object.fromEntries([
      ['did:plc:author', createActor()],
      ...relatedActivity.map(activity => {
        const did = activity.record.uri.split('/')[2] as ActivityActor['did']
        return [did, createActor(did)]
      }),
    ]),
  })
}

function share(
  did: ActivityActor['did'] = 'did:plc:author',
  rkey = 'share',
  text = 'Some commentary',
) {
  const actor = createActor(did)
  const uri = `at://${did}/app.bsky.feed.post/${rkey}` as const
  return createActivity({
    collection: activityCollections.share,
    did,
    rkey,
    view: createPostView({
      uri,
      author: actor,
      record: {...createShareRecord(), text},
      embed: {
        $type: 'app.bsky.embed.external#view',
        external: getArticleExternalView(createActivity())!,
      },
    }),
  })
}

function shareRow(count = 1) {
  const row = createRow(
    Array.from({length: count}, (_, i) =>
      share(`did:plc:sharer${i}`, 'share', `Commentary ${i}`),
    ),
  )
  row.actors['did:plc:author'] = createActor()
  return row
}

function subscriptionRow(count = 1, view = createPublicationView()) {
  return createRow(
    Array.from({length: count}, (_, i) =>
      createActivity({
        collection: activityCollections.subscription,
        did: `did:plc:subscriber${i}`,
        view,
      }),
    ),
    {subject: publicationUri},
  )
}

function streamRow(
  fields: Partial<app.bsky.embed.external.ViewLivestream> = {},
  count = 1,
) {
  return createRow(
    Array.from({length: count}, (_, i) =>
      createActivity({
        collection: activityCollections.livestream,
        rkey: `stream${i}`,
        view: createLivestreamView({
          title: i === 0 ? 'A real stream' : `Hidden stream ${i}`,
          uri: `https://stream.example/real${i}`,
          createdAt: '2026-01-01T00:00:00Z',
          startedAt: '2026-01-01T00:00:00Z',
          ...fields,
        }),
      }),
    ),
    {groupBy: 'actor'},
  )
}

function photoRow(
  count = 1,
  collection: ActivityItem['collection'] = activityCollections.grainGallery,
) {
  return createRow(
    Array.from({length: count}, (_, i) =>
      createActivity({
        collection,
        rkey: `gallery${i}`,
        view: createGalleryView({
          items: [
            {
              $type: 'app.bsky.embed.external#viewGalleryImage',
              thumbnail: `https://images.example/thumb-${i}.jpg`,
              fullsize: `https://images.example/full-${i}.jpg`,
              alt: `Photo ${i}`,
              aspectRatio: {width: 2, height: 3},
            },
          ],
        }),
      }),
    ),
    {groupBy: 'actor'},
  )
}

function activities(row: ActivityPresentationItem) {
  return row.type === 'activity' ? [row.activity] : row.group.items
}

describe('hydrated articles and recommendation proof', () => {
  it.each([false, true])(
    'features hydrated articles regardless of subscription (%s)',
    subscribed => {
      const screen = renderRow(documentRow(subscribed))
      expect(screen.getByTestId('atmosphereArticleCard')).toBeTruthy()
      expect(screen.queryByTestId('atmosphereFootnote')).toBeNull()
      expect(screen.getByText('An article')).toBeTruthy()
      hasLink('https://publication.example/')
      hasLink('/profile/author.example')
    },
  )

  it('shows the display name without hiding the account handle', () => {
    const row = documentRow()
    row.actors['did:plc:author'].displayName = 'Alex Rivera 🌿'
    const screen = renderRow(row)
    expect(screen.getByText(/Alex Rivera 🌿/)).toBeOnTheScreen()
    expect(screen.getByText(/@author\.example/)).toBeOnTheScreen()
  })

  it('keeps recommendation actor and hydrated article links', () => {
    const screen = renderRow(recommendationRow())
    expect(screen.getByTestId('atmosphereArticleCard')).toBeTruthy()
    hasLink('/profile/actor0.example')
    hasLink('https://publication.example/article')
  })

  it('counts distinct usable recommendation actors', () => {
    const row = recommendationRow(8)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items.push(row.group.items[0])
    delete row.actors['did:plc:actor6']
    row.actors['did:plc:actor7'].handle = 'handle.invalid'
    const screen = renderRow(row)
    expect(screen.getByLabelText(/and 5 others recommended/)).toBeTruthy()
  })

  it.each([activityCollections.document, activityCollections.recommendation])(
    'bounds actor groups to the first title and raw count (%s)',
    collection => {
      const row = createRow(
        Array.from({length: 15}, (_, i) =>
          createActivity({
            collection,
            rkey: String(i),
            subscribed: true,
            view: createArticleView({title: `Article ${i}`}),
          }),
        ),
        {groupBy: 'actor'},
      )
      const screen = renderRow(row)
      expect(screen.getByText(/^Article 0/)).toBeTruthy()
      expect(screen.getByText(/and 14 more articles/)).toBeTruthy()
      expect(screen.queryByText('Article 1')).toBeNull()
    },
  )

  it('does not substitute a later article for a missing first view', () => {
    const first = createActivity({rkey: 'missing', subscribed: true})
    first.view = undefined
    const screen = renderRow(
      createRow([first, createActivity({subscribed: true})], {
        groupBy: 'actor',
      }),
    )
    expect(screen.queryByText('An article')).toBeNull()
    expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
    expect(screen.getByText(/and 1 more article/)).toBeTruthy()
  })

  it.each(['', 'javascript:alert(1)', 'https://user:pass@article.example/'])(
    'never links unsafe hydrated article URI %s',
    uri => {
      const screen = renderRow(
        createRow([
          createActivity({
            subscribed: true,
            view: createArticleView({
              uri: uri as app.bsky.embed.external.ViewArticle['uri'],
            }),
          }),
        ]),
      )
      expect(screen.getByText('An article')).toBeTruthy()
      expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
      expect(
        mockLink.mock.calls.every(([props]) =>
          String(props.to).startsWith('/profile/'),
        ),
      ).toBe(true)
    },
  )

  it('preserves Unicode titles and hydrated description', () => {
    const title = 'مرحبا 🌌 '.repeat(30)
    const screen = renderRow(
      createRow([
        createActivity({
          subscribed: true,
          view: createArticleView({title, description: 'Actual preview'}),
        }),
      ]),
    )
    expect(screen.getByText(title.trim())).toBeTruthy()
    expect(screen.getByText('Actual preview')).toBeTruthy()
  })

  it('keeps mixed recommendation and self-share proof within one article', () => {
    const shared = share()
    const row = documentRow(false, [recommend('did:plc:friend'), shared])
    const screen = renderRow(row)
    expect(screen.getAllByTestId('atmosphereArticleCard')).toHaveLength(1)
    expect(screen.queryByTestId('atmosphereShareCard')).toBeNull()
    expect(screen.getByLabelText(/friend.example.*recommended/)).toBeTruthy()
    expect(mockShareSnippets).toHaveBeenCalledWith(
      expect.objectContaining({
        shares: [{activity: shared, actor: row.actors['did:plc:author']}],
        hideActorMetadataForDid: 'did:plc:author',
      }),
    )
  })
})

describe('hydrated publication and subscriptions', () => {
  it.each([1, 2, 4])(
    'renders a publication card for %s usable subscribers',
    count => {
      const screen = renderRow(subscriptionRow(count))
      expect(screen.getByTestId('atmosphereSubscriptionCard')).toBeOnTheScreen()
      expect(screen.queryByTestId('atmosphereFootnote')).toBeNull()
      expect(screen.getByText('A publication')).toBeOnTheScreen()
      hasLink('https://publication.example/')
      hasLink('/profile/subscriber0.example')
    },
  )

  it('summarizes actor-group subscriptions without selecting a later publication', () => {
    const items = Array.from({length: 10}, (_, i) =>
      createActivity({
        collection: activityCollections.subscription,
        rkey: String(i),
        view: createPublicationView({title: `Publication ${i}`}),
      }),
    )
    const row = createRow(items, {groupBy: 'actor'})
    const screen = renderRow(row)
    expect(screen.getByText(/^Publication 0/)).toBeTruthy()
    expect(screen.getByText(/and 9 more publications/)).toBeTruthy()
    expect(screen.queryByText('Publication 1')).toBeNull()
    expect(screen.getByTestId('atmosphereSubscriptionCard')).toBeOnTheScreen()
    screen.unmount()
    items[0].view = undefined
    const missing = renderRow(row)
    expect(missing.queryByText(/Publication \d/)).toBeNull()
    expect(missing.queryByTestId('publication-cta')).toBeNull()
  })

  it.each(['', 'javascript:alert(1)'])(
    'does not link unsafe publication URI %s',
    uri => {
      const screen = renderRow(
        subscriptionRow(
          2,
          createPublicationView({
            uri: uri as app.bsky.embed.external.ViewArticlePublication['uri'],
          }),
        ),
      )
      expect(screen.queryByTestId('atmosphereSubscriptionCard')).toBeNull()
      expect(mockSubscribeButton).not.toHaveBeenCalled()
    },
  )
})

describe('hydrated share cards', () => {
  it('preserves one article preview and all posts for expansion', () => {
    const row = shareRow(5)
    const screen = renderRow(row)
    expect(
      screen.getAllByTestId('atmosphereShareDocumentPreview'),
    ).toHaveLength(1)
    expect(screen.getByLabelText(/and 4 others shared/)).toBeTruthy()
    expect(
      mockShareSnippets.mock.calls[0][0].shares.map(item => item.activity),
    ).toEqual(activities(row))
    expect(screen.getByText('Commentary 0')).toBeTruthy()
  })

  it('counts distinct people independently from post URI deduplication', () => {
    const row = createRow([
      share('did:plc:one'),
      share('did:plc:two'),
      share('did:plc:one', 'second'),
    ])
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items.push(row.group.items[0])
    const screen = renderRow(row)
    expect(screen.getByLabelText(/and 1 other shared/)).toBeTruthy()
    expect(mockShareSnippets.mock.calls[0][0].shares).toHaveLength(3)
  })

  it('keeps shared article author and publication links independent', () => {
    const screen = renderRow(shareRow())
    expect(screen.getByTestId('atmosphereShareDocumentByline')).toBeTruthy()
    hasLink('/profile/author.example')
    hasLink('https://publication.example/')
    hasLink('/profile/sharer0.example')
  })

  it('does not substitute later actor-group posts for the first unavailable post', () => {
    const first = share('did:plc:author', 'first', 'First commentary')
    const row = createRow(
      [first, share('did:plc:author', 'second', 'Later commentary')],
      {groupBy: 'actor'},
    )
    const screen = renderRow(row)
    expect(screen.getByText('First commentary')).toBeTruthy()
    expect(screen.queryByText('Later commentary')).toBeNull()
    expect(screen.getByText('and 1 more post')).toBeTruthy()
    screen.unmount()
    first.view = undefined
    const missing = renderRow(row)
    expect(missing.queryByText('Later commentary')).toBeNull()
    expect(missing.queryByTestId('atmosphereShareCard')).toBeNull()
  })
})

describe('hydrated stream lifecycle', () => {
  it('preserves hydrated lifecycle duration on an ended stream card', () => {
    const row = streamRow({active: false, endedAt: '2026-01-01T00:48:59Z'})
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereEndedLivestream')).toBeTruthy()
    expect(screen.getByText('A real stream')).toBeTruthy()
    expect(screen.queryByText('LIVE NOW')).toBeNull()
    hasLink('https://stream.example/real0')
  })

  it.each(['', 'not a date', '2025-12-31T00:00:00Z'])(
    'keeps a present end value %s ended without an invalid duration',
    endedAt => {
      const screen = renderRow(
        streamRow({
          active: false,
          endedAt: endedAt as app.bsky.embed.external.ViewLivestream['endedAt'],
        }),
      )
      expect(screen.getByTestId('atmosphereEndedLivestream')).toBeTruthy()
      expect(screen.queryByLabelText(/\b(?:sec|min)\b|NaN|Infinity/)).toBeNull()
      expect(screen.queryByTestId('atmosphereActiveLivestream')).toBeNull()
    },
  )

  it('honors inactive unfinished views instead of claiming they are live', () => {
    const screen = renderRow(streamRow({active: false, endedAt: undefined}))
    expect(screen.queryByTestId('atmosphereActiveLivestream')).toBeNull()
    expect(screen.queryByText('LIVE NOW')).toBeNull()
    expect(screen.getByTestId('atmosphereEndedLivestream')).toBeTruthy()
  })

  it('uses supplied active status, URI and image without inventing viewers', () => {
    const screen = renderRow(
      streamRow({active: true, image: 'https://media.example/stream.jpg'}),
    )
    expect(screen.getByText('LIVE NOW')).toBeTruthy()
    expect(
      screen.getByTestId('atmosphereLivestreamThumbnail').props.source,
    ).toEqual({uri: 'https://media.example/stream.jpg'})
    expect(screen.queryByText(/watching|friends/i)).toBeNull()
    hasLink('https://stream.example/real0')
  })

  it('falls back to createdAt when startedAt is absent', () => {
    const screen = renderRow(
      streamRow({
        active: false,
        startedAt: undefined,
        endedAt: '2026-01-01T00:02:00Z',
      }),
    )
    expect(screen.getByLabelText(/streamed for 2 min/)).toBeTruthy()
  })

  it.each(['', 'javascript:alert(1)', 'https://user:pass@stream.example/'])(
    'omits unsafe stream link %s',
    uri => {
      renderRow(
        streamRow({uri: uri as app.bsky.embed.external.ViewLivestream['uri']}),
      )
      expect(
        mockLink.mock.calls.every(([props]) =>
          String(props.to).startsWith('/profile/'),
        ),
      ).toBe(true)
    },
  )
})

describe('hydrated gallery media and accessible lightboxes', () => {
  function imageRef() {
    return Object.assign(
      () => {
        throw new Error('Test image ref should not be invoked')
      },
      {current: null, observe: () => () => {}},
    )
  }

  it('opens a single-image lightbox with the captured reference and dimensions', () => {
    const screen = renderRow(photoRow())
    expect(screen.getByTestId('atmospherePhotoCard')).toBeTruthy()
    expect(screen.getByLabelText(/posted a gallery/)).toBeTruthy()
    const props = mockAutoSizedImage.mock.calls[0][0]
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
      screen.getByLabelText(
        /posted 87 galleries.*elapsed:2026-09-11T09:00:00Z/,
      ),
    ).toBeTruthy()
    const props = mockGallery.mock.calls[0][0]
    expect(props.images).toHaveLength(10)
    expect(props.images.map(image => image.alt)).toEqual(
      Array.from({length: 10}, (_, i) => `Photo ${i}`),
    )
    props.onPress?.(9, [], [])
    const lightbox = mockOpenLightbox.mock.calls[0][0]
    expect(lightbox.images).toHaveLength(10)
    expect(lightbox.index).toBe(9)
    expect(lightbox.images[9].alt).toBe('Photo 9')
    expect(lightbox.metricsContext).toBeUndefined()
    expect(mockAutoSizedImage).not.toHaveBeenCalled()
    expect(row.group.items).toHaveLength(87)
  })

  it('compacts skipped images before selecting a lightbox index', () => {
    const row = photoRow(3)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items[1].view = createGalleryView({items: []})
    const screen = renderRow(row)
    expect(screen.getByLabelText(/posted 3 galleries/)).toBeTruthy()
    const gallery = mockImageLayoutGrid.mock.calls[0][0]
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

  it('aligns a screen-reader carousel thumbnail with the selected lightbox image', () => {
    renderRow(photoRow(5))
    const ref = imageRef(),
      dims = {width: 600, height: 900}
    mockGallery.mock.calls[0][0].onPress?.(1, [ref], [dims])
    const lightbox = mockOpenLightbox.mock.calls[0][0]
    expect(lightbox.index).toBe(1)
    expect(lightbox.images[0].thumbRef).toBeNull()
    expect(lightbox.images[0].thumbDimensions).toBeNull()
    expect(lightbox.images[1].thumbRef).toBe(ref)
    expect(lightbox.images[1].thumbDimensions).toBe(dims)
    expect(lightbox.images[4].thumbRef).toBeNull()
  })

  it('keeps a surviving image as a singleton without changing the raw group count', () => {
    const row = photoRow(3)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items[0].view = undefined
    row.group.items[2].view = undefined
    const screen = renderRow(row)
    expect(screen.getByLabelText(/posted 3 galleries/)).toBeTruthy()
    const image = mockAutoSizedImage.mock.calls[0][0]
    expect(image.image.alt).toBe('Photo 1')
    image.onPress?.(imageRef(), null)
    expect(mockOpenLightbox.mock.calls[0][0].index).toBe(0)
    expect(mockGallery).not.toHaveBeenCalled()
  })

  it('renders no media frame or empty card when all images are missing', () => {
    const row = photoRow(2)
    for (const activity of activities(row)) activity.view = undefined
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereFootnote')).toBeTruthy()
    expect(screen.queryByTestId('atmospherePhotoCard')).toBeNull()
    expect(mockGallery).not.toHaveBeenCalled()
    expect(mockAutoSizedImage).not.toHaveBeenCalled()
  })

  it('keeps alt text as media metadata, not a visible caption', () => {
    const row = photoRow()
    if (row.type !== 'activity') throw new Error('Expected activity')
    const alt = '🌇 وصف الصورة - actual alt, not a caption'
    row.activity.view = createGalleryView({
      items: [
        {
          $type: 'app.bsky.embed.external#viewGalleryImage',
          thumbnail: 'https://media.example/thumb.jpg',
          fullsize: 'https://media.example/full.jpg',
          alt,
        },
      ],
    })
    const screen = renderRow(row)
    expect(mockAutoSizedImage.mock.calls[0][0].image.alt).toBe(alt)
    expect(screen.queryByText(alt)).toBeNull()
  })
})

describe('collection dispatch and hydrated view boundaries', () => {
  it.each([
    [activityCollections.document, 'atmosphereDocumentRow'],
    [activityCollections.recommendation, 'atmosphereRecommendationRow'],
    [activityCollections.publication, 'atmospherePublicationRow'],
    [activityCollections.subscription, 'atmosphereSubscriptionRow'],
    [activityCollections.livestream, 'atmosphereLivestreamRow'],
    [activityCollections.grainGallery, 'atmosphereGrainGalleryRow'],
    [activityCollections.grainFavorite, 'atmosphereGrainFavoriteRow'],
    [activityCollections.share, 'atmosphereShareRow'],
    ['example.unknown' as ActivityItem['collection'], 'atmosphereUnknownRow'],
  ] as const)(
    'dispatches the original API collection %s',
    (collection, testID) => {
      const screen = renderRow(createRow([createActivity({collection})]))
      expect(screen.getByTestId(testID)).toBeTruthy()
    },
  )

  it('does not render incompatible views as media for a known collection', () => {
    const screen = renderRow(
      createRow([
        createActivity({
          collection: activityCollections.grainGallery,
          view: createArticleView(),
        }),
      ]),
    )
    expect(screen.queryByTestId('atmospherePhotoCard')).toBeNull()
    expect(mockGallery).not.toHaveBeenCalled()
    expect(mockAutoSizedImage).not.toHaveBeenCalled()
  })
})

describe('hydrated metadata regressions', () => {
  it('keeps original hydrated objects reachable from the outer debug control', () => {
    const row = documentRow(true, [recommend('did:plc:one')])
    const log = jest.spyOn(console, 'log').mockImplementation()
    try {
      const screen = renderRow(row)
      fireEvent.press(screen.getByTestId('atmosphereDebugButton'))
      const logged = log.mock.calls[0][0] as ActivityPresentationItem
      expect(activities(logged)[0].view).toBe(activities(row)[0].view)
      expect(activities(logged)[0].relatedActivity?.[0]).toBe(
        activities(row)[0].relatedActivity?.[0],
      )
    } finally {
      log.mockRestore()
    }
  })

  it('keeps grouped subscriber counts distinct without suppressing a single subscriber card', () => {
    const row = subscriptionRow(8)
    if (row.type !== 'group') throw new Error('Expected group')
    row.group.items.push(row.group.items[0])
    delete row.actors['did:plc:subscriber6']
    row.actors['did:plc:subscriber7'].handle = 'handle.invalid'
    const screen = renderRow(row)
    expect(screen.getByLabelText(/and 5 others subscribed/)).toBeTruthy()
    screen.unmount()
    for (const i of [1, 2, 3, 4, 5]) delete row.actors[`did:plc:subscriber${i}`]
    expect(
      renderRow(row).queryByTestId('atmosphereSubscriptionCard'),
    ).toBeOnTheScreen()
  })

  it('ignores viewer subscription on subscription interaction rows', () => {
    const row = subscriptionRow()
    if (row.type !== 'activity') throw new Error('Expected activity')
    row.activity.viewerState.subscribed = true
    expect(
      renderRow(row).queryByTestId('atmosphereSubscriptionCard'),
    ).toBeOnTheScreen()
  })

  it('excludes unavailable actors and different share targets from social proof', () => {
    const row = shareRow(3)
    if (row.type !== 'group') throw new Error('Expected group')
    delete row.actors['did:plc:sharer1']
    const third = row.group.items[2]
    third.view = createPostView({
      uri: third.record.uri,
      author: createActor('did:plc:sharer2'),
      record: createShareRecord(`${documentUri}-other`),
      embed: {
        $type: 'app.bsky.embed.external#view',
        external: {
          ...getArticleExternalView(createActivity())!,
          associatedRefs: [
            {uri: `${documentUri}-other`, cid: third.record.cid},
          ],
        },
      },
    })
    const screen = renderRow(row)
    expect(screen.queryByLabelText(/others shared/)).toBeNull()
    expect(
      mockShareSnippets.mock.calls[0][0].shares.map(item => item.activity),
    ).toEqual([row.group.items[0]])
  })

  it('preserves a usable post without inventing absent article media', () => {
    const activity = share()
    const post = getActivityPostView(activity)!
    activity.view = createPostView({
      ...post,
      embed: {
        $type: 'app.bsky.embed.external#view',
        external: {
          ...getArticleExternalView(activity)!,
          thumb: undefined,
        },
      },
    })
    const screen = renderRow(createRow([activity]))
    expect(screen.queryByTestId('atmosphereShareDocumentThumbnail')).toBeNull()
    expect(screen.getByText('Some commentary')).toBeTruthy()
  })

  it('bounds ended stream actor groups to the first supplied title and duration', () => {
    const row = streamRow({active: false, endedAt: '2026-01-01T01:53:10Z'}, 13)
    if (row.type !== 'group') throw new Error('Expected group')
    const screen = renderRow(row)
    expect(screen.getByText('A real stream')).toBeTruthy()
    expect(screen.getByText('and 12 more livestreams')).toBeTruthy()
    expect(screen.queryByText(/Hidden stream/)).toBeNull()
    expect(row.group.items).toHaveLength(13)
  })

  it('does not substitute a later stream when the first hydrated view is missing', () => {
    const row = streamRow({active: false}, 2)
    activities(row)[0].view = undefined
    const screen = renderRow(row)
    expect(screen.getByTestId('atmosphereUnavailableLivestream')).toBeTruthy()
    expect(screen.queryByText(/Hidden stream/)).toBeNull()
  })
})

it('renders external record-with-media shares without displaying the quoted post', () => {
  const activity = share('did:plc:author')
  const post = getActivityPostView(activity)!
  activity.view = createPostView({
    ...post,
    record: createShareRecord(documentUri, true),
    embed: {
      $type: 'app.bsky.embed.recordWithMedia#view',
      media: {
        $type: 'app.bsky.embed.external#view',
        external: getArticleExternalView(activity)!,
      },
      record: {
        $type: 'app.bsky.embed.record#view',
        record: {
          $type: 'app.bsky.embed.record#viewNotFound',
          uri: 'at://did:plc:quoted/app.bsky.feed.post/quote',
          notFound: true,
        },
      },
    },
  })
  const screen = renderRow(createRow([activity]))
  expect(screen.getByTestId('atmosphereShareCard')).toBeTruthy()
  expect(screen.getByText('An article')).toBeTruthy()
  expect(screen.getByText('Some commentary')).toBeTruthy()
  expect(
    mockLink.mock.calls.some(([props]) => String(props.to).includes('quoted')),
  ).toBe(false)
})

it('does not fabricate an unavailable article author from recommendation actors', () => {
  const row = createRow(
    [0, 1].map(i =>
      createActivity({
        collection: activityCollections.recommendation,
        did: `did:plc:actor${i}`,
        view: createArticleView({associatedProfiles: undefined}),
      }),
    ),
  )
  renderRow(row)
  expect(
    mockLink.mock.calls.some(
      ([props]) => props.to === '/profile/author.example',
    ),
  ).toBe(false)
})

it('omits missing hydrated stream images without generating a thumbnail', () => {
  const screen = renderRow(streamRow({image: undefined}))
  expect(screen.queryByTestId('atmosphereLivestreamThumbnail')).toBeNull()
  expect(screen.getByText('LIVE NOW')).toBeTruthy()
})
