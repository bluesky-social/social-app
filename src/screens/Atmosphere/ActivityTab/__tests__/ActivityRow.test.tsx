import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {makeActivityListLink} from '#/screens/Atmosphere/ActivityList/links'
import {
  type AtmosphereFeedback,
  AtmosphereFeedbackProvider,
} from '#/screens/Atmosphere/feedback'
import {AtmosphereMetricsScope} from '#/screens/Atmosphere/metrics/context'
import {InlineLinkText} from '#/components/Link'
import {ActivityRow} from '../components/ActivityRow'
import {getStreamDuration, isLive} from '../components/LivestreamCard'
import {
  type ActivityRow as ActivityRowModel,
  type TimelineEntry,
  toActivityRows,
} from '../rows'
import {
  actorGroup,
  article,
  caelin,
  camp,
  danielle,
  debbie,
  eric,
  gallery,
  item,
  label,
  livestream,
  manton,
  moderationOpts,
  NSID,
  page,
  paul,
  publication,
  related,
  subjectGroup,
} from './fixtures'

const mockMetric = jest.fn()
const mockDocumentCard = jest.fn()

jest.mock('#/features/feedFeedback', () => ({useFeedFeedbackCore: jest.fn()}))
jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: false}),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {font_semi_bold: {fontWeight: '600'}, text_sm: {fontSize: 14}},
    {get: (target, key) => target[key as keyof typeof target] ?? {}},
  ),
  useAlf: () => ({fonts: {scaleMultiplier: 1}}),
  useTheme: () => ({
    atoms: new Proxy({}, {get: () => ({})}),
    palette: {primary_500: '#0085ff'},
  }),
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Link', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  const MockLink = jest.fn(
    ({
      children,
      to,
      label,
      testID,
      onPress,
      style,
    }: {
      children: React.ReactNode
      to: string
      label: string
      testID?: string
      onPress?: () => void
      style?: React.ComponentProps<typeof Text>['style']
    }) => {
      return (
        <Text
          testID={testID}
          accessibilityRole="link"
          accessibilityLabel={label}
          accessibilityHint=""
          accessibilityValue={{text: to}}
          style={style}
          onPress={onPress}>
          {children}
        </Text>
      )
    },
  )
  return {InlineLinkText: MockLink, Link: MockLink}
})
jest.mock('#/components/Admonition', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Admonition: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
  }
})
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    children,
  }: {
    children: (props: {timeElapsed: string}) => React.ReactNode
  }) => children({timeElapsed: '1h'}),
}))
jest.mock('#/view/com/util/UserAvatar', () => ({
  PreviewableUserAvatar: () => null,
}))
jest.mock('#/components/AvatarStack', () => ({AvatarStack: () => null}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      testID,
      onPress,
    }: {
      label: string
      testID?: string
      onPress: () => void
    }) => (
      <Pressable
        testID={testID}
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}
      />
    ),
  }
})
jest.mock('#/components/moderation/ModerationDetailsDialog', () => ({
  ModerationDetailsDialog: () => null,
  useModerationDetailsDialogControl: () => ({open: jest.fn()}),
}))
jest.mock('#/lib/moderation/useModerationCauseDescription', () => ({
  useModerationCauseDescription: () => ({name: 'Content warning'}),
}))
jest.mock('#/components/icons/community/Grain', () => ({GrainMark: () => null}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))
jest.mock('#/components/atmosphere/SiteStandard/Document', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Document: (props: {
      onPressCallback: () => void
      onShareCallback?: () => void
    }) => {
      mockDocumentCard(props)
      const {onPressCallback, onShareCallback} = props
      return (
        <Pressable
          testID="documentCard"
          accessibilityLabel="Article"
          accessibilityHint=""
          onPress={onPressCallback}
          onLongPress={onShareCallback}
        />
      )
    },
  }
})
jest.mock('#/components/atmosphere/SiteStandard/Publication', () => ({
  PublicationCard: () => null,
}))
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: () => null,
}))
jest.mock('../components/GalleryCard', () => ({GalleryCard: () => null}))
jest.mock('../components/LivestreamCard', () => ({
  ...jest.requireActual('../components/LivestreamCard'),
  LivestreamCard: () => null,
}))

i18n.loadAndActivate({locale: 'en', messages: {}})

function renderRow(row: ActivityRowModel, feedback?: AtmosphereFeedback) {
  return render(
    <I18nProvider i18n={i18n}>
      <AtmosphereFeedbackProvider value={feedback}>
        <ActivityRow row={row} position={0} />
      </AtmosphereFeedbackProvider>
    </I18nProvider>,
  )
}

function rowOf(entry: TimelineEntry) {
  return toActivityRows(page([entry]), 0, moderationOpts)[0]
}

function renderEntry(entry: TimelineEntry) {
  return renderRow(rowOf(entry))
}

function expectHeader(sentence: string, app?: string) {
  expect(screen.getByText(sentence)).toBeTruthy()
  expect(screen.queryByText('View all')).toBeNull()
  if (app) {
    expect(screen.getByText(app, {exact: false})).toBeTruthy()
  } else {
    expect(screen.getByText('1h')).toBeTruthy()
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ActivityRow', () => {
  it.each([true, false])(
    'only sends clickthrough and share feedback inside a recommendation scope: %s',
    inScope => {
      const feedback = jest.fn()
      const row = rowOf(
        item({actor: debbie, collection: NSID.document, view: article()}),
      )
      renderRow(row, inScope ? feedback : undefined)
      fireEvent.press(screen.getByTestId('documentCard'))
      fireEvent(screen.getByTestId('documentCard'), 'longPress')
      if (inScope) {
        expect(feedback.mock.calls).toEqual([
          ['app.bsky.feed.defs#clickthroughItem'],
          ['app.bsky.feed.defs#interactionShare'],
        ])
      } else {
        expect(feedback).not.toHaveBeenCalled()
      }
    },
  )

  it('masks a card the user can click through until they reveal it', () => {
    renderEntry(
      item({
        actor: debbie,
        collection: NSID.document,
        view: article(undefined, {labels: [label('!warn')]}),
      }),
    )
    expectHeader('Debbie Ridpath Ohi published an article', 'Leaflet')
    expect(screen.queryByTestId('documentCard')).toBeNull()
    fireEvent.press(screen.getByTestId('activityContentMask'))
    expect(screen.getByTestId('documentCard')).toBeTruthy()
  })

  it('renders a published article with its recommends', () => {
    renderEntry(
      item({
        actor: debbie,
        collection: NSID.document,
        view: article(),
        relatedActivity: related([danielle, caelin, paul]),
      }),
    )
    expectHeader('Debbie Ridpath Ohi published an article', 'Leaflet')
    // The card names them in its social proof.
    expect(mockDocumentCard).toHaveBeenLastCalledWith(
      expect.objectContaining({
        recommenders: expect.objectContaining({
          actors: [danielle, caelin, paul],
          actorCount: 3,
        }),
      }),
    )
    expect(screen.queryByTestId('activityGroupLink')).toBeNull()
  })

  it.each([
    [NSID.recommend, article('caelin.pckt.blog'), 'recommended an article'],
    [NSID.subscription, publication(), 'subscribed to a publication'],
  ])(
    'keeps the people count noninteractive for %s',
    (collection, view, verb) => {
      renderEntry(
        subjectGroup({
          actors: [danielle, caelin, paul],
          collection,
          view,
        }),
      )
      expectHeader(`Danielle Yuhan and 2 others ${verb}`)
      expect(screen.queryByTestId('activityGroupLink')).toBeNull()
      expect(screen.getAllByRole('link')).toHaveLength(1)
      expect(screen.getByRole('link', {name: 'Danielle Yuhan'})).toBeTruthy()
    },
  )

  it('links the recommended article count to the articles, not recommends', () => {
    const row = rowOf(
      actorGroup({
        actor: eric,
        collection: NSID.recommend,
        view: article('paul.pckt.blog'),
        count: 16,
      }),
    )
    renderRow(row)
    expectHeader('Eric recommended 16 articles')
    expect(screen.getByTestId('activityGroupLink')).toHaveTextContent(
      '16 articles',
    )
    expect(
      screen.getByTestId('activityGroupLink').props.accessibilityValue,
    ).toEqual({
      text: makeActivityListLink(
        row.kind === 'card' ? (row.subjectUris ?? []) : [],
      ),
    })
  })

  it('names the app of the newest article in a published group', () => {
    renderEntry(
      actorGroup({
        actor: eric,
        collection: NSID.document,
        view: article('paul.pckt.blog'),
        count: 3,
      }),
    )
    expectHeader('Eric published 3 articles', 'pckt')
  })

  const contentGroups = [
    [NSID.document, article(), 'published', 'articles', 'Leaflet'],
    [NSID.recommend, article(), 'recommended', 'articles', undefined],
    [
      NSID.subscription,
      publication(),
      'subscribed to',
      'publications',
      undefined,
    ],
    [NSID.gallery, gallery(), 'posted', 'galleries', 'Grain'],
    [NSID.livestream, livestream(), 'was live', 'times', 'Streamplace'],
  ] as const

  it.each(contentGroups)(
    'links the %s count to the group with the default hover/focus underline',
    (collection, view, verb, noun, appName) => {
      const row = rowOf(actorGroup({actor: eric, collection, view, count: 3}))
      renderRow(row)

      expectHeader(`Eric ${verb} 3 ${noun}`, appName)
      const link = screen.getByTestId('activityGroupLink')
      expect(link).toHaveTextContent(`3 ${noun}`)
      expect(link).toHaveStyle({fontWeight: '600', color: '#0085ff'})
      expect(row.kind === 'card' && row.subjectUris).toHaveLength(3)
      expect(link.props.accessibilityValue).toEqual({
        text: makeActivityListLink(
          row.kind === 'card' ? (row.subjectUris ?? []) : [],
        ),
      })
      const props = jest
        .mocked(InlineLinkText)
        .mock.calls.find(([props]) => props.testID === 'activityGroupLink')?.[0]
      expect(props).toBeDefined()
      expect(props?.disableUnderline).not.toBe(true)
    },
  )

  it.each(contentGroups)(
    'does not link a single-item %s count',
    (collection, view) => {
      renderEntry(actorGroup({actor: eric, collection, view, count: 1}))

      expect(screen.queryByTestId('activityGroupLink')).toBeNull()
      expect(screen.queryByText('View all')).toBeNull()
    },
  )

  it('keeps a link to grouped streams while the newest one is live', () => {
    renderEntry(
      actorGroup({
        actor: camp,
        collection: NSID.livestream,
        view: livestream({active: true, endedAt: undefined}),
        count: 3,
      }),
    )

    expectHeader('pdx.atproto.camp is live · 3 livestreams', 'Streamplace')
    expect(screen.getByTestId('activityGroupLink')).toHaveTextContent(
      '3 livestreams',
    )
  })

  it('does not create a broken link when a group has no subject URIs', () => {
    const row = rowOf(
      actorGroup({
        actor: eric,
        collection: NSID.document,
        view: article(),
        count: 3,
      }),
    )
    if (row.kind !== 'card') throw new Error('Expected a card')
    renderRow({...row, subjectUris: undefined})

    expectHeader('Eric published 3 articles', 'Leaflet')
    expect(screen.queryByTestId('activityGroupLink')).toBeNull()
  })

  it('logs one group-list event with the tab the count was pressed from', () => {
    mockMetric.mockClear()
    const row = rowOf(
      actorGroup({
        actor: eric,
        collection: NSID.document,
        view: article('paul.pckt.blog'),
        count: 3,
      }),
    )
    render(
      <I18nProvider i18n={i18n}>
        <AtmosphereMetricsScope tab="following" surface="tab" isActive>
          <ActivityRow row={row} position={0} />
        </AtmosphereMetricsScope>
      </I18nProvider>,
    )

    fireEvent.press(screen.getByTestId('activityGroupLink'))
    expect(
      mockMetric.mock.calls.filter(
        ([name]) => name === 'atmosphere:activity:viewAll',
      ),
    ).toEqual([
      [
        'atmosphere:activity:viewAll',
        {
          tab: 'following',
          surface: 'tab',
          subjectCount: 3,
          collection: NSID.document,
        },
      ],
    ])
  })

  it.each([
    [false, 'was live'],
    [true, 'is live'],
  ])('renders a livestream (live: %s)', (live, verb) => {
    renderEntry(
      item({
        actor: camp,
        collection: NSID.livestream,
        view: livestream(live ? {active: true, endedAt: undefined} : {}),
      }),
    )
    // No display name, so the handle stands in.
    expectHeader(`pdx.atproto.camp ${verb}`, 'Streamplace')
  })

  it('shows only the time for an unrecognized publisher', () => {
    renderEntry(
      item({
        actor: debbie,
        collection: NSID.document,
        view: article('blog.example.com'),
      }),
    )
    expectHeader('Debbie Ridpath Ohi published an article')
  })

  it('never names an app for a subscription', () => {
    renderEntry(
      item({actor: eric, collection: NSID.subscription, view: publication()}),
    )
    expectHeader('Eric subscribed to a publication')
  })

  it('renders a posted gallery', () => {
    renderEntry(
      item({actor: manton, collection: NSID.gallery, view: gallery()}),
    )
    expectHeader('Manton Reece posted a gallery', 'Grain')
  })

  it('renders a warning for unrenderable entries', () => {
    renderRow({kind: 'warning', key: 'x', reason: 'missing-actor'})
    expect(
      screen.getByText('This activity can’t be shown right now.'),
    ).toBeTruthy()
  })
})

describe('isLive', () => {
  it('requires an active stream with no endedAt', () => {
    expect(isLive(livestream({active: true, endedAt: undefined}))).toBe(true)
    expect(isLive(livestream({active: true}))).toBe(false)
    expect(isLive(livestream({active: false, endedAt: undefined}))).toBe(false)
  })
})

describe('getStreamDuration', () => {
  it('formats ended streams and skips live or invalid ones', () => {
    expect(
      getStreamDuration('2026-11-09T00:00:00Z', '2026-11-09T03:50:23Z'),
    ).toBe('3:50:23')
    expect(
      getStreamDuration('2026-11-09T00:00:00Z', '2026-11-09T00:04:05Z'),
    ).toBe('4:05')
    expect(getStreamDuration('2026-11-09T00:00:00Z', undefined)).toBeUndefined()
    expect(
      getStreamDuration('2026-11-09T01:00:00Z', '2026-11-09T00:00:00Z'),
    ).toBeUndefined()
  })
})
