import {type PressableProps} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {sanitizeHandle} from '#/lib/strings/handles'
import {ActivityV2Screen} from './index'
import {activityCollections} from './types'

const mockUseActivityV2Query = jest.fn()
const mockListFooter = jest.fn((_props: unknown) => null)
const mockAvatarStack = jest.fn()
const mockInlineLinkText = jest.fn()
const mockPublicationCard = jest.fn((_props: unknown) => null)
const mockStandardSiteEmbed = jest.fn((_props: unknown) => null)
const mockTimeElapsed = jest.fn()
let latestListProps: ListProps | undefined

type ChildrenProps = {children?: React.ReactNode; testID?: string}
type EmptyStateProps = {
  message: string
  button?: {
    label: string
    onPress?: PressableProps['onPress']
    text: string
  }
  testID?: string
}
type ListItem = Record<string, unknown>
type ListProps = {
  data: ListItem[]
  renderItem: (args: {item: ListItem; index: number}) => React.ReactNode
  keyExtractor: (item: ListItem) => string
  ListFooterComponent?: React.ReactNode
  onEndReached?: () => Promise<void> | void
  onRefresh?: () => Promise<void> | void
}

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  utils: {rgbToHex: () => '#000000'},
  useTheme: () => ({
    atoms: {
      border_contrast_low: {},
      text: {color: '#111111'},
      text_inverted: {color: '#ffffff'},
      text_contrast_medium: {},
      text_link: {color: '#0a7aff'},
      bg: {backgroundColor: '#ffffff'},
    },
  }),
}))
jest.mock('#/components/AvatarStack', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    AvatarStack: (props: unknown) => {
      mockAvatarStack(props)
      return <View testID="activityV2AvatarStack" />
    },
  }
})
jest.mock('#/components/icons/Atom', () => ({
  Atom_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Layout', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Screen: ({children, testID}: ChildrenProps) => (
      <View testID={testID}>{children}</View>
    ),
    Header: {
      Outer: ({children}: ChildrenProps) => <>{children}</>,
      BackButton: () => null,
      Content: ({children}: ChildrenProps) => <>{children}</>,
      TitleText: ({children}: ChildrenProps) => <Text>{children}</Text>,
      Slot: () => null,
    },
  }
})
jest.mock('#/components/Link', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    InlineLinkText: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      mockInlineLinkText({children, ...props})
      return <Text {...props}>{children}</Text>
    },
  }
})
jest.mock('#/components/Lists', () => ({
  ListFooter: (props: unknown) => {
    mockListFooter(props)
    return null
  },
}))
jest.mock('#/components/Loader', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Loader: () => <Text>loader</Text>}
})
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PublicationCard: (props: unknown) => {
      mockPublicationCard(props)
      return <View testID="activityV2PublicationCard" />
    },
    StandardSiteEmbed: (props: unknown) => {
      mockStandardSiteEmbed(props)
      return <View testID="activityV2StandardSiteEmbed" />
    },
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    children,
    timestamp,
  }: {
    timestamp: string
    children: (value: {timeElapsed: string}) => React.ReactNode
  }) => {
    mockTimeElapsed({timestamp})
    return children({timeElapsed: `elapsed:${timestamp}`})
  },
}))
jest.mock('#/lib/hooks/useInitialNumToRender', () => ({
  useInitialNumToRender: () => 1,
}))
jest.mock('#/view/com/util/EmptyState', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    EmptyState: ({button, message, testID}: EmptyStateProps) => (
      <View testID={testID}>
        <Text>{message}</Text>
        {button ? (
          <Pressable
            accessibilityHint=""
            accessibilityLabel={button.label}
            accessibilityRole="button"
            onPress={button.onPress}>
            <Text>{button.text}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  }
})
jest.mock('#/view/com/util/List', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    List: (props: ListProps) => {
      latestListProps = props
      return (
        <View>
          {props.data.map((item, index) => (
            <View key={props.keyExtractor(item)}>
              {props.renderItem({item, index})}
            </View>
          ))}
          {props.ListFooterComponent ? (
            <View key="footer">{props.ListFooterComponent}</View>
          ) : null}
        </View>
      )
    },
  }
})
jest.mock('./query', () => ({
  useActivityV2Query: () => mockUseActivityV2Query(),
}))

i18n.loadAndActivate({locale: 'en', messages: {}})

beforeEach(() => {
  latestListProps = undefined
  mockAvatarStack.mockClear()
  mockInlineLinkText.mockClear()
  mockListFooter.mockClear()
  mockPublicationCard.mockClear()
  mockStandardSiteEmbed.mockClear()
  mockTimeElapsed.mockClear()
  mockUseActivityV2Query.mockReset()
})

function renderScreen() {
  return render(
    <I18nProvider i18n={i18n}>
      <ActivityV2Screen
        route={{key: 'ActivityV2', name: 'ActivityV2'}}
        navigation={{} as never}
      />
    </I18nProvider>,
  )
}

function handleLabel(handle: string) {
  return sanitizeHandle(handle, '@')
}

function activity({
  collection,
  uri,
  cid,
}: {
  collection: string
  uri: string
  cid: string
}) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid,
      indexedAt: '2026-09-03T00:00:00.000Z',
    },
    collection,
    viewerState: {subscribed: true},
  }
}

function actor(did: string, handle: string) {
  return {
    did,
    handle,
    avatar: `https://example.com/${did}.jpg`,
  }
}

describe('ActivityV2Screen', () => {
  it('keeps the route shell intact and renders standalone, grouped, and unknown V2 rows without JSON diagnostics', () => {
    const groupChildOne = activity({
      collection: activityCollections.document,
      uri: 'at://did:plc:group-author/site.standard.document/one',
      cid: 'bafy-group-one',
    })
    const groupChildTwo = activity({
      collection: activityCollections.document,
      uri: 'at://did:plc:group-author/site.standard.document/two',
      cid: 'bafy-group-two',
    })
    const group = {
      $type: 'eric.bsky.atmosphere.getActivity#group' as const,
      id: 'opaque-group-id',
      groupBy: 'actor' as const,
      collection: activityCollections.document,
      indexedAt: '2026-09-03T00:00:00.000Z',
      actor: 'did:plc:group-author',
      items: [groupChildOne, groupChildTwo],
    }
    const documentActivity = activity({
      collection: activityCollections.document,
      uri: 'at://did:plc:author/site.standard.document/three',
      cid: 'bafy-document',
    })
    const publicationActivity = activity({
      collection: activityCollections.publication,
      uri: 'at://did:plc:author/site.standard.publication/one',
      cid: 'bafy-publication',
    })
    const recommendationActivity = activity({
      collection: activityCollections.recommendation,
      uri: 'at://did:plc:author/site.standard.graph.recommend/one',
      cid: 'bafy-recommendation',
    })
    const subscriptionActivity = activity({
      collection: activityCollections.subscription,
      uri: 'at://did:plc:author/site.standard.graph.subscription/one',
      cid: 'bafy-subscription',
    })
    const livestreamActivity = activity({
      collection: activityCollections.livestream,
      uri: 'at://did:plc:author/place.stream.livestream/one',
      cid: 'bafy-livestream',
    })
    const grainPhotoActivity = activity({
      collection: activityCollections.grainPhoto,
      uri: 'at://did:plc:author/social.grain.photo/one',
      cid: 'bafy-grain-photo',
    })
    const unknownCollectionActivity = activity({
      collection: 'example.unknown.collection',
      uri: 'at://did:plc:author/example.unknown.collection/one',
      cid: 'bafy-unknown',
    })

    mockUseActivityV2Query.mockReturnValue({
      data: {
        pages: [
          {
            feed: [
              group,
              documentActivity,
              publicationActivity,
              recommendationActivity,
              subscriptionActivity,
              livestreamActivity,
              grainPhotoActivity,
              unknownCollectionActivity,
            ],
            associatedRecords: {},
            actors: {
              'did:plc:author': actor('did:plc:author', 'author.test'),
              'did:plc:group-author': actor(
                'did:plc:group-author',
                'group-author.test',
              ),
            },
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const screen = renderScreen()

    expect(screen.getByTestId('activityV2Screen')).toBeTruthy()
    expect(screen.getByText('Activity V2')).toBeTruthy()
    expect(screen.getAllByTestId('activityV2DocumentRow')).toHaveLength(2)
    expect(screen.getByTestId('activityV2PublicationRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2RecommendationRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2SubscriptionRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2LivestreamRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2GrainPhotoRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2UnknownRow')).toBeTruthy()
    expect(
      screen.getByLabelText(
        `${handleLabel('group-author.test')} published 2 articles`,
      ),
    ).toBeTruthy()
    expect(
      screen.getByLabelText(`${handleLabel('author.test')} did something`),
    ).toBeTruthy()
    expect(screen.queryByText(JSON.stringify(documentActivity))).toBeNull()
    expect(screen.queryByText(JSON.stringify(group))).toBeNull()
    expect(mockListFooter).toHaveBeenCalledWith(
      expect.objectContaining({hasNextPage: true, isFetchingNextPage: false}),
    )
  })

  it('renders loading and empty states', () => {
    mockUseActivityV2Query.mockReturnValue({
      data: undefined,
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const loadingScreen = renderScreen()
    expect(loadingScreen.getByText('loader')).toBeTruthy()

    mockUseActivityV2Query.mockReturnValue({
      data: {
        pages: [{feed: [], associatedRecords: {}, actors: {}}],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const emptyScreen = renderScreen()
    expect(emptyScreen.getByTestId('activityV2EmptyState')).toBeTruthy()
  })

  it('omits actorless successful rows and falls back to the V2 empty state', () => {
    mockUseActivityV2Query.mockReturnValue({
      data: {
        pages: [
          {
            feed: [
              activity({
                collection: activityCollections.document,
                uri: 'at://did:plc:ghost/site.standard.document/one',
                cid: 'bafy-ghost',
              }),
            ],
            associatedRecords: {},
            actors: {},
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const screen = renderScreen()

    expect(screen.getByTestId('activityV2EmptyState')).toBeTruthy()
    expect(mockListFooter).not.toHaveBeenCalled()
  })

  it('keeps the retry control wired for initial errors', () => {
    const refetch = jest.fn()
    mockUseActivityV2Query.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch,
    })

    const screen = renderScreen()
    fireEvent.press(screen.getByLabelText('Retry loading activity'))

    expect(refetch).toHaveBeenCalled()
    expect(screen.getByTestId('activityV2ErrorState')).toBeTruthy()
  })

  it('keeps refresh and pagination wired through the list callbacks', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined)
    const fetchNextPage = jest.fn().mockResolvedValue(undefined)

    mockUseActivityV2Query.mockReturnValue({
      data: {
        pages: [
          {
            feed: [
              activity({
                collection: activityCollections.document,
                uri: 'at://did:plc:author/site.standard.document/one',
                cid: 'bafy-document',
              }),
            ],
            associatedRecords: {},
            actors: {
              'did:plc:author': actor('did:plc:author', 'author.test'),
            },
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage,
      refetch,
    })

    renderScreen()

    await act(async () => {
      await latestListProps?.onRefresh?.()
    })
    await act(async () => {
      await latestListProps?.onEndReached?.()
    })

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })
})
