import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render} from '@testing-library/react-native'

import {type ActivityGroupRowItem, type ActivityRowItem} from '../model'
import {type ActivityActor, activityCollections} from '../types'
import {ActivityRelatedActivity} from './ActivityRelatedActivity'

const mockAvatarStack = jest.fn()

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: {text: {}}}),
}))
jest.mock('#/components/AvatarStack', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    AvatarStack: (props: Record<string, unknown>) => {
      mockAvatarStack(props)
      return <View testID="related-avatar-stack" />
    },
  }
})
jest.mock('#/components/Link', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    InlineLinkText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/lib/routes/links', () => ({
  makeProfileLink: ({handle}: {handle: string}) => `/profile/${handle}`,
}))

i18n.loadAndActivate({locale: 'en', messages: {}})

function actor(index: number): ActivityActor {
  return {
    did: `did:plc:actor${index}`,
    handle: `actor${index}.test`,
    avatar: `https://example.com/${index}.jpg`,
  }
}

function relatedActivity(index: number) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri: `at://did:plc:actor${index}/${activityCollections.recommendation}/${index}`,
      cid: `bafy-related-${index}`,
      indexedAt: `2026-09-03T00:0${index}:00.000Z`,
    },
    collection: activityCollections.recommendation,
    viewerState: {subscribed: false},
  }
}

function renderRelatedActivity() {
  const rootUri = `at://did:plc:author/${activityCollections.document}/one`
  const actors = Object.fromEntries(
    Array.from({length: 6}, (_, index) => {
      const value = actor(index)
      return [value.did, value]
    }),
  )
  const item: ActivityRowItem = {
    type: 'activity',
    key: rootUri,
    activity: {
      $type: 'eric.bsky.atmosphere.getActivity#item',
      record: {
        uri: rootUri,
        cid: 'bafy-document',
        indexedAt: '2026-09-03T00:00:00.000Z',
      },
      collection: activityCollections.document,
      viewerState: {subscribed: false},
      relatedActivity: [
        ...Array.from({length: 6}, (_, index) => relatedActivity(index)),
        relatedActivity(0),
        relatedActivity(7),
      ],
    },
    associatedRecords: {},
    actors,
  }

  return render(
    <I18nProvider i18n={i18n}>
      <ActivityRelatedActivity item={item} />
    </I18nProvider>,
  )
}

describe('ActivityRelatedActivity', () => {
  beforeEach(() => {
    mockAvatarStack.mockClear()
  })

  it('renders a small actor summary and counts all unique hydrated actors', () => {
    const result = renderRelatedActivity()

    expect(result.getByLabelText(/and 5 others recommended/)).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenCalledWith(
      expect.objectContaining({
        profiles: expect.arrayContaining([
          expect.objectContaining({did: 'did:plc:actor0'}),
          expect.objectContaining({did: 'did:plc:actor4'}),
        ]),
        size: 16,
      }),
    )
    const firstCall = mockAvatarStack.mock.calls[0] as
      [{profiles: ActivityActor[]}] | undefined
    expect(firstCall?.[0].profiles).toHaveLength(5)
  })

  it('renders related activity only for the first document in an actor group', () => {
    const firstUri = `at://did:plc:author/${activityCollections.document}/first`
    const secondUri = `at://did:plc:author/${activityCollections.document}/second`
    const item: ActivityGroupRowItem = {
      type: 'group',
      key: 'actor-document-group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'actor-document-group',
        groupBy: 'actor',
        collection: activityCollections.document,
        indexedAt: '2026-09-03T00:00:00.000Z',
        actor: 'did:plc:author',
        items: [
          {
            $type: 'eric.bsky.atmosphere.getActivity#item',
            record: {
              uri: firstUri,
              cid: 'bafy-first',
              indexedAt: '2026-09-03T00:00:00.000Z',
            },
            collection: activityCollections.document,
            viewerState: {subscribed: false},
            relatedActivity: [relatedActivity(0)],
          },
          {
            $type: 'eric.bsky.atmosphere.getActivity#item',
            record: {
              uri: secondUri,
              cid: 'bafy-second',
              indexedAt: '2026-09-02T00:00:00.000Z',
            },
            collection: activityCollections.document,
            viewerState: {subscribed: false},
            relatedActivity: [relatedActivity(1)],
          },
        ],
      },
      associatedRecords: {},
      actors: {
        'did:plc:actor0': actor(0),
        'did:plc:actor1': actor(1),
      },
    }

    render(
      <I18nProvider i18n={i18n}>
        <ActivityRelatedActivity item={item} />
      </I18nProvider>,
    )

    expect(mockAvatarStack).toHaveBeenCalledTimes(1)
    expect(mockAvatarStack).toHaveBeenCalledWith(
      expect.objectContaining({
        profiles: [expect.objectContaining({did: 'did:plc:actor0'})],
      }),
    )
  })
})
