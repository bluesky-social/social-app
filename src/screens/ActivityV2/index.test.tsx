import {type PressableProps} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {ActivityV2Screen} from './index'
import {activityCollections} from './types'

const mockUseActivityV2Query = jest.fn()
const mockListFooter = jest.fn((_props: unknown) => null)

type ChildrenProps = {children?: React.ReactNode}
type EmptyStateProps = {
  message: string
  button?: {
    label: string
    onPress?: PressableProps['onPress']
    text: string
  }
  testID?: string
}
type ListItem = {key: string} & Record<string, unknown>
type ListProps = {
  data: ListItem[]
  renderItem: (args: {item: ListItem; index: number}) => React.ReactNode
  ListFooterComponent?: React.ReactNode
  onEndReached?: () => void
  onRefresh?: () => void
}

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: {border_contrast_low: {}, text: {}}}),
}))
jest.mock('#/components/icons/Atom', () => ({
  Atom_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Layout', () => ({
  Screen: ({children}: ChildrenProps) => children,
  Header: {
    Outer: ({children}: ChildrenProps) => children,
    BackButton: () => null,
    Content: ({children}: ChildrenProps) => children,
    TitleText: ({children}: ChildrenProps) => children,
    Slot: () => null,
  },
}))
jest.mock('#/components/Lists', () => ({
  ListFooter: (props: unknown) => {
    mockListFooter(props)
    return null
  },
}))
jest.mock('#/components/Loader', () => ({Loader: () => 'loader'}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => {
  throw new Error('Detailed Activity embed UI should not be used by ActivityV2')
})
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
    List: ({data, renderItem, ListFooterComponent}: ListProps) => (
      <View>
        {data.map((item, index) => (
          <View key={item.key}>{renderItem({item, index})}</View>
        ))}
        {ListFooterComponent}
      </View>
    ),
  }
})
jest.mock('./query', () => ({
  useActivityV2Query: () => mockUseActivityV2Query(),
}))

i18n.loadAndActivate({locale: 'en', messages: {}})

beforeEach(() => {
  mockListFooter.mockClear()
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

describe('ActivityV2Screen', () => {
  it('dispatches each known standalone collection to its dedicated V2 row and keeps group rows as JSON previews', () => {
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

    expect(screen.getByTestId('activityV2DocumentRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2PublicationRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2RecommendationRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2SubscriptionRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2LivestreamRow')).toBeTruthy()
    expect(screen.getByTestId('activityV2GrainPhotoRow')).toBeTruthy()
    expect(
      screen.getByText(JSON.stringify(documentActivity)).props.numberOfLines,
    ).toBe(1)
    expect(screen.getByText(JSON.stringify(group)).props.numberOfLines).toBe(1)
    expect(mockListFooter).toHaveBeenCalledWith(
      expect.objectContaining({hasNextPage: true, isFetchingNextPage: false}),
    )
  })

  it('uses activity.collection for standalone dispatch and falls back safely for unknown collections', () => {
    const mismatchedUriActivity = activity({
      collection: activityCollections.subscription,
      uri: 'at://did:plc:author/site.standard.document/not-used-for-dispatch',
      cid: 'bafy-mismatched-uri',
    })
    const unknownCollectionActivity = activity({
      collection: 'example.unknown.collection',
      uri: 'not-an-at-uri',
      cid: 'bafy-unknown',
    })

    mockUseActivityV2Query.mockReturnValue({
      data: {
        pages: [
          {
            feed: [mismatchedUriActivity, unknownCollectionActivity],
            associatedRecords: {},
            actors: {},
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const screen = renderScreen()

    expect(screen.getByTestId('activityV2SubscriptionRow')).toBeTruthy()
    expect(screen.getByText(JSON.stringify(mismatchedUriActivity))).toBeTruthy()
    expect(screen.getByTestId('activityV2UnknownRow')).toBeTruthy()
    expect(
      screen.getByText(JSON.stringify(unknownCollectionActivity)),
    ).toBeTruthy()
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
})
