import {type PressableProps} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {type AssociatedRecords} from '#/state/queries/atmosphereActivityTypes'
import {
  ActivityRow,
  ActorDocumentGroupRow,
  ActorRecommendationGroupRow,
  ActorSubscriptionGroupRow,
} from './Activity'
import {type ActivityGroupRowItem} from './activityModel'

type ChildrenProps = {children?: React.ReactNode}
type ButtonMockProps = ChildrenProps & {
  label: string
  onPress?: PressableProps['onPress']
  testID?: string
}
type LinkMockProps = ChildrenProps & {
  label?: string
  onPress?: PressableProps['onPress']
}
type CompactCardProps = {
  view?: {title?: string}
}
type StandardEmbedProps = {
  view?: {title?: string}
}
type PublicationCardProps = {
  view?: {title?: string; source?: {title?: string}}
}
type TimeElapsedProps = {
  children: (value: {timeElapsed: string}) => React.ReactNode
}

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  tokens: {space: {md: 12, xl: 16}},
  useTheme: () => ({
    atoms: {
      border_contrast_low: {},
      text: {},
      text_inverted: {},
      text_contrast_medium: {},
    },
    palette: {},
  }),
  utils: {},
  web: (styles: unknown) => styles,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({children, label, onPress, testID}: ButtonMockProps) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ButtonText: ({children}: ChildrenProps) => <Text>{children}</Text>,
  }
})
jest.mock('#/components/Link', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    InlineLinkText: ({children, label, onPress}: LinkMockProps) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole="link"
        onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  }
})
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PublicationCard: ({view}: PublicationCardProps) => {
      const title =
        view?.source?.title || view?.title || 'Publication unavailable'
      return (
        <Pressable
          accessibilityHint=""
          accessibilityLabel={`View ${title}`}
          accessibilityRole="link"
          testID={`publication-${title}`}>
          <Text>{title}</Text>
        </Pressable>
      )
    },
    StandardSiteEmbed: ({view}: StandardEmbedProps) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={view?.title || 'Document unavailable'}
        accessibilityRole="link"
        testID={`full-document-${view?.title || 'unavailable'}`}>
        <Text>{view?.title || 'Document unavailable'}</Text>
      </Pressable>
    ),
  }
})
jest.mock('#/components/Post/Embed/StandardSiteEmbed/utils', () => ({
  isStandardSitePublicationEmbed: () => false,
}))
jest.mock(
  '#/components/Post/Embed/StandardSiteEmbed/StandardSiteCompactDocumentCard',
  () => {
    const {Pressable, Text} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return {
      StandardSiteCompactDocumentCard: ({view}: CompactCardProps) => {
        const title = view?.title || 'Post unavailable'
        return (
          <Pressable
            accessibilityHint=""
            accessibilityLabel={title}
            accessibilityRole="link"
            testID={`document-${title}`}>
            <Text>{title}</Text>
          </Pressable>
        )
      },
    }
  },
)
jest.mock('#/components/AvatarStack', () => ({AvatarStack: () => null}))
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
jest.mock('#/components/Lists', () => ({ListFooter: () => null}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/lib/hooks/useInitialNumToRender', () => ({
  useInitialNumToRender: () => 1,
}))
jest.mock('#/state/queries/atmosphereActivity', () => ({
  useAtmosphereActivityQuery: () => ({data: undefined}),
}))
jest.mock('#/view/com/util/EmptyState', () => ({EmptyState: () => null}))
jest.mock('#/view/com/util/List', () => ({List: () => null}))
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({children}: TimeElapsedProps) => children({timeElapsed: 'now'}),
}))
jest.mock('#/view/com/util/UserAvatar', () => ({
  UserAvatar: () => null,
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})

i18n.loadAndActivate({locale: 'en', messages: {}})

const recommendationBase = 'at://did:plc:brookie/site.standard.graph.recommend/'
const documentBase = 'at://did:plc:author/site.standard.document/'
const subscriptionBase =
  'at://did:plc:brookie/site.standard.graph.subscription/'
const publicationBase = 'at://did:plc:publisher/site.standard.publication/'

function activity(uri: string) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `cid-${uri.at(-1)}`,
      indexedAt: '2026-09-03T00:00:00.000Z',
    },
    viewerState: {subscribed: false},
  }
}

function makeGroup(): ActivityGroupRowItem {
  const items = ['one', 'two', 'three'].map(name =>
    activity(`${recommendationBase}${name}`),
  )
  const associatedRecords: AssociatedRecords = {}
  for (const name of ['one', 'two', 'three']) {
    associatedRecords[`${recommendationBase}${name}`] = {
      uri: `${recommendationBase}${name}`,
      cid: `recommendation-${name}`,
      record: {
        $type: 'site.standard.graph.recommend',
        document: `${documentBase}${name}`,
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    }
    associatedRecords[`${documentBase}${name}`] = {
      uri: `${documentBase}${name}`,
      cid: `document-${name}`,
      record: {
        $type: 'site.standard.document',
        site: 'https://brookie.example',
        path: `/posts/${name}`,
        title: `Document ${name}`,
        publishedAt: '2026-09-03T00:00:00.000Z',
      },
    }
  }
  return {
    type: 'group',
    key: 'opaque-group-id',
    group: {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: 'opaque-group-id',
      groupBy: 'actor',
      collection: 'site.standard.graph.recommend',
      indexedAt: '2026-09-03T00:00:00.000Z',
      actor: 'did:plc:brookie',
      items,
    },
    associatedRecords,
    actors: {
      'did:plc:brookie': {
        did: 'did:plc:brookie',
        handle: 'brookie.blog',
      },
    },
  }
}

function makeDocumentGroup(): ActivityGroupRowItem {
  const items = ['one', 'two', 'three'].map(name =>
    activity(`${documentBase}${name}`),
  )
  const associatedRecords: AssociatedRecords = {}
  for (const name of ['one', 'two', 'three']) {
    associatedRecords[`${documentBase}${name}`] = {
      uri: `${documentBase}${name}`,
      cid: `document-${name}`,
      record: {
        $type: 'site.standard.document',
        site: 'https://alice.example',
        path: `/posts/${name}`,
        title: `Document ${name}`,
        publishedAt: '2026-09-03T00:00:00.000Z',
      },
    }
  }
  return {
    type: 'group',
    key: 'document-group-id',
    group: {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: 'document-group-id',
      groupBy: 'actor',
      collection: 'site.standard.document',
      indexedAt: '2026-09-03T00:00:00.000Z',
      actor: 'did:plc:author',
      items,
    },
    associatedRecords,
    actors: {
      'did:plc:author': {
        did: 'did:plc:author',
        handle: 'alice.mosphere.at',
      },
    },
  }
}

function makeStandaloneDocumentRow() {
  const group = makeDocumentGroup()
  const activityItem = group.group.items[0]
  return {
    type: 'activity' as const,
    key: activityItem.record.uri,
    activity: activityItem,
    associatedRecords: group.associatedRecords,
    actors: group.actors,
  }
}

function makeSubscriptionGroup(): ActivityGroupRowItem {
  const items = ['one', 'two', 'three'].map(name =>
    activity(`${subscriptionBase}${name}`),
  )
  const associatedRecords: AssociatedRecords = {}
  for (const name of ['one', 'two', 'three']) {
    associatedRecords[`${subscriptionBase}${name}`] = {
      uri: `${subscriptionBase}${name}`,
      cid: `subscription-${name}`,
      record: {
        $type: 'site.standard.graph.subscription',
        publication: `${publicationBase}${name}`,
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    }
    associatedRecords[`${publicationBase}${name}`] = {
      uri: `${publicationBase}${name}`,
      cid: `publication-${name}`,
      record: {
        $type: 'site.standard.publication',
        name: `Publication ${name}`,
        url: `https://example.com/publications/${name}`,
      },
    }
  }
  return {
    type: 'group',
    key: 'subscription-group-id',
    group: {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: 'subscription-group-id',
      groupBy: 'actor',
      collection: 'site.standard.graph.subscription',
      indexedAt: '2026-09-03T00:00:00.000Z',
      actor: 'did:plc:brookie',
      items,
    },
    associatedRecords,
    actors: {
      'did:plc:brookie': {
        did: 'did:plc:brookie',
        handle: 'brookie.blog',
      },
    },
  }
}

describe('ActivityRow', () => {
  it('renders a full StandardSiteEmbed from hydrated document sidecars', () => {
    const result = render(
      <I18nProvider i18n={i18n}>
        <ActivityRow item={makeStandaloneDocumentRow()} hideTopBorder={false} />
      </I18nProvider>,
    )

    expect(result.getByText(/published/)).toBeTruthy()
    expect(result.getByTestId('full-document-Document one')).toBeTruthy()
  })

  it('keeps the activity sentence when document view construction fails', () => {
    const row = makeStandaloneDocumentRow()
    row.associatedRecords[row.activity.record.uri].record.site = 'at://invalid'

    const result = render(
      <I18nProvider i18n={i18n}>
        <ActivityRow item={row} hideTopBorder={false} />
      </I18nProvider>,
    )

    expect(result.getByText(/published/)).toBeTruthy()
    expect(result.queryByTestId('full-document-Document one')).toBeNull()
  })
})

describe('ActorDocumentGroupRow', () => {
  it('summarizes in API order, expands independently, and preserves its count', () => {
    const result = render(
      <I18nProvider i18n={i18n}>
        <ActorDocumentGroupRow
          item={makeDocumentGroup()}
          hideTopBorder={false}
        />
      </I18nProvider>,
    )

    expect(result.getByRole('link', {name: /alice\.mosphere\.at/})).toBeTruthy()
    expect(result.getByText(/3 posts/)).toBeTruthy()
    expect(
      result.getAllByTestId(/^document-/).map(node => node.props.testID),
    ).toEqual(['document-Document one', 'document-Document two'])
    expect(result.queryByTestId('document-Document three')).toBeNull()

    fireEvent.press(result.getByRole('link', {name: /alice\.mosphere\.at/}))
    fireEvent.press(result.getByRole('link', {name: 'Document one'}))
    expect(result.queryByTestId('document-Document three')).toBeNull()

    fireEvent.press(result.getByRole('button', {name: 'See more'}))
    expect(result.getByTestId('document-Document three')).toBeTruthy()

    fireEvent.press(result.getByRole('button', {name: 'See less'}))
    expect(result.queryByTestId('document-Document three')).toBeNull()
  })

  it('represents malformed children without changing the summary count', () => {
    const group = makeDocumentGroup()
    delete group.associatedRecords[`${documentBase}one`]

    const result = render(
      <I18nProvider i18n={i18n}>
        <ActorDocumentGroupRow item={group} hideTopBorder={false} />
      </I18nProvider>,
    )

    expect(result.getByText(/3 posts/)).toBeTruthy()
    expect(result.getByRole('link', {name: 'Post unavailable'})).toBeTruthy()
  })
})

describe('ActorRecommendationGroupRow', () => {
  it('summarizes, collapses, expands, and does not expand from other targets', () => {
    const result = render(
      <I18nProvider i18n={i18n}>
        <ActorRecommendationGroupRow item={makeGroup()} hideTopBorder={false} />
      </I18nProvider>,
    )

    expect(result.getByRole('link', {name: /brookie\.blog/})).toBeTruthy()
    expect(result.getByText(/3 posts/)).toBeTruthy()
    expect(result.getByTestId('document-Document one')).toBeTruthy()
    expect(result.getByTestId('document-Document two')).toBeTruthy()
    expect(result.queryByTestId('document-Document three')).toBeNull()

    const actor = result.getByRole('link', {name: /brookie\.blog/})
    fireEvent.press(actor)
    fireEvent.press(result.getByRole('link', {name: 'Document one'}))
    expect(result.queryByTestId('document-Document three')).toBeNull()

    const seeMore = result.getByRole('button', {name: 'See more'})
    fireEvent.press(seeMore)
    expect(result.getByTestId('document-Document three')).toBeTruthy()
    expect(result.getByRole('button', {name: 'See less'})).toBeTruthy()

    fireEvent.press(result.getByRole('button', {name: 'See less'}))
    expect(result.queryByTestId('document-Document three')).toBeNull()
  })

  it('keeps the summary when a document sidecar is unavailable', () => {
    const group = makeGroup()
    delete group.associatedRecords[`${documentBase}one`]

    const result = render(
      <I18nProvider i18n={i18n}>
        <ActorRecommendationGroupRow item={group} hideTopBorder={false} />
      </I18nProvider>,
    )

    expect(result.getByText(/3 posts/)).toBeTruthy()
    expect(result.getByRole('link', {name: 'Post unavailable'})).toBeTruthy()
  })
})

describe('ActorSubscriptionGroupRow', () => {
  it('summarizes publications in API order and only expands from its toggle', () => {
    const result = render(
      <I18nProvider i18n={i18n}>
        <ActorSubscriptionGroupRow
          item={makeSubscriptionGroup()}
          hideTopBorder={false}
        />
      </I18nProvider>,
    )

    expect(result.getByRole('link', {name: /brookie\.blog/})).toBeTruthy()
    expect(result.getByText(/3 publications/)).toBeTruthy()
    expect(
      result
        .getAllByTestId(/publication-/)
        .map(node => node.props.accessibilityLabel),
    ).toEqual(['View Publication one', 'View Publication two'])
    expect(result.queryByTestId('publication-Publication three')).toBeNull()

    fireEvent.press(result.getByRole('link', {name: /brookie\.blog/}))
    fireEvent.press(result.getByRole('link', {name: 'View Publication one'}))
    expect(result.queryByTestId('publication-Publication three')).toBeNull()

    fireEvent.press(result.getByRole('button', {name: 'See more'}))
    expect(result.getByTestId('publication-Publication three')).toBeTruthy()
    expect(result.getByRole('button', {name: 'See less'})).toBeTruthy()

    fireEvent.press(result.getByRole('button', {name: 'See less'}))
    expect(result.queryByTestId('publication-Publication three')).toBeNull()
  })

  it('keeps a malformed child represented without crashing', () => {
    const group = makeSubscriptionGroup()
    delete group.associatedRecords[`${publicationBase}one`]

    const result = render(
      <I18nProvider i18n={i18n}>
        <ActorSubscriptionGroupRow item={group} hideTopBorder={false} />
      </I18nProvider>,
    )

    expect(result.getByText(/Activity from/)).toBeTruthy()
    expect(result.getByTestId('publication-Publication two')).toBeTruthy()
    expect(result.queryByTestId('publication-Publication three')).toBeNull()
  })
})
