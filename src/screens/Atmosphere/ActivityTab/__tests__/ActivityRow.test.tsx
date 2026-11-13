import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {makeActivityListLink} from '#/screens/Atmosphere/ActivityList/links'
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

const mockLinkTo = jest.fn()

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({
    atoms: new Proxy({}, {get: () => ({})}),
    palette: new Proxy({}, {get: () => '#000'}),
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
  return {
    InlineLinkText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
    Link: ({
      children,
      to,
      testID,
    }: {
      children: React.ReactNode
      to: string
      testID?: string
    }) => {
      mockLinkTo(to)
      return <Text testID={testID}>{children}</Text>
    },
  }
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
jest.mock('#/components/atmosphere/SiteStandard/DocumentCompact', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {DocumentCompactCard: () => <View testID="documentCard" />}
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

function renderRow(row: ActivityRowModel) {
  return render(
    <I18nProvider i18n={i18n}>
      <ActivityRow row={row} />
    </I18nProvider>,
  )
}

function rowOf(entry: TimelineEntry) {
  return toActivityRows(page([entry]), 0, moderationOpts)[0]
}

function renderEntry(entry: TimelineEntry) {
  return renderRow(rowOf(entry))
}

/** The sentence, then "1h on" and the app name (just "1h" without an app). */
function expectHeader(sentence: string, app?: string) {
  expect(screen.getByText(sentence)).toBeTruthy()
  if (app) {
    expect(screen.getByText('1h on')).toBeTruthy()
    expect(screen.getByText(app)).toBeTruthy()
  } else {
    expect(screen.getByText('1h')).toBeTruthy()
    expect(screen.queryByText('1h on')).toBeNull()
  }
}

describe('ActivityRow', () => {
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
    expect(screen.getByText('Recommended by Danielle Yuhan +2')).toBeTruthy()
    expect(screen.queryByTestId('activityViewAll')).toBeNull()
  })

  it('renders a subject group as "and N others"', () => {
    renderEntry(
      subjectGroup({
        actors: [danielle, caelin, paul],
        collection: NSID.recommend,
        view: article('caelin.pckt.blog'),
      }),
    )
    // Recommends can come from any app, so none is named.
    expectHeader('Danielle Yuhan and 2 others recommended an article')
  })

  it('links View all on a recommend group to the recommended articles', () => {
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
    expect(screen.getByTestId('activityViewAll')).toBeTruthy()
    expect(mockLinkTo).toHaveBeenCalledWith(
      makeActivityListLink(row.kind === 'card' ? (row.subjectUris ?? []) : []),
    )
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

  it('links View all to the group as an activity list', () => {
    const row = rowOf(
      actorGroup({
        actor: eric,
        collection: NSID.document,
        view: article('paul.pckt.blog'),
        count: 3,
      }),
    )
    renderRow(row)
    expect(screen.getByTestId('activityViewAll')).toBeTruthy()
    expect(row.kind === 'card' && row.subjectUris).toHaveLength(3)
    expect(mockLinkTo).toHaveBeenCalledWith(
      makeActivityListLink(row.kind === 'card' ? (row.subjectUris ?? []) : []),
    )
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
