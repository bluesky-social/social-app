import {type PressableProps} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {ActivityV2Screen} from './index'

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

describe('ActivityV2Screen', () => {
  it('renders one-line JSON previews for activity and group rows only', () => {
    const activity = {
      $type: 'eric.bsky.atmosphere.getActivity#item',
      record: {
        uri: 'at://did:plc:author/site.standard.document/one',
        cid: 'bafy-one',
        indexedAt: '2026-09-03T00:00:00.000Z',
      },
      viewerState: {subscribed: true},
    }
    const group = {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: 'opaque-group-id',
      groupBy: 'actor',
      collection: 'site.standard.document',
      indexedAt: '2026-09-03T00:00:00.000Z',
      actor: 'did:plc:author',
      items: [
        activity,
        {
          ...activity,
          record: {
            ...activity.record,
            uri: 'at://did:plc:author/site.standard.document/two',
            cid: 'bafy-two',
          },
        },
      ],
    }
    const standaloneActivity = {
      ...activity,
      record: {
        ...activity.record,
        uri: 'at://did:plc:author/site.standard.document/three',
        cid: 'bafy-three',
      },
    }

    mockUseActivityV2Query.mockReturnValue({
      data: {
        pages: [
          {
            feed: [group, standaloneActivity],
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

    expect(
      screen.getByText(JSON.stringify(standaloneActivity)).props.numberOfLines,
    ).toBe(1)
    expect(screen.getByText(JSON.stringify(group)).props.numberOfLines).toBe(1)
    expect(mockListFooter).toHaveBeenCalledWith(
      expect.objectContaining({hasNextPage: true, isFetchingNextPage: false}),
    )
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
