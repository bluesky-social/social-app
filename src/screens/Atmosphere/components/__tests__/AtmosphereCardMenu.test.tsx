import {StyleSheet, Text} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app, place, site, social} from '#/lexicons'
import {AtmosphereCardMenu} from '../AtmosphereCardMenu'

const mockOpenLink = jest.fn()
const mockNavigate = jest.fn()
const mockOpenReport = jest.fn()

/* Report availability relies on real CID validation, which the repo mocks. */
jest.unmock('multiformats/cid')
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string}) => value.message,
    i18n: {number: String},
  }),
}))
jest.mock('#/alf', () => ({atoms: new Proxy({}, {get: () => ({})})}))
jest.mock('#/lib/hooks/useOpenLink', () => ({
  useOpenLink: () => mockOpenLink,
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}))
jest.mock('#/components/moderation/ReportDialog', () => ({
  getAssociatedReportSubjects: jest.requireActual<
    typeof import('#/components/moderation/ReportDialog/utils/parseReportSubject')
  >('#/components/moderation/ReportDialog/utils/parseReportSubject')
    .getAssociatedReportSubjects,
  useCopyForSubject: jest.requireActual<
    typeof import('#/components/moderation/ReportDialog/copy')
  >('#/components/moderation/ReportDialog/copy').useCopyForSubject,
  useGlobalReportDialogControl: () => ({open: mockOpenReport}),
}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({label, testID}: {label: string; testID?: string}) => (
      <Pressable
        testID={testID}
        accessibilityLabel={label}
        accessibilityHint=""
      />
    ),
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/icons/DotGrid', () => ({
  DotGrid3x1_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Person', () => ({
  Person_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Square', () => ({
  SquareArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Warning', () => ({
  Warning_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Menu', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Root: ({children}: {children: React.ReactNode}) => children,
    Trigger: ({
      children,
      label,
    }: {
      children: (state: {props: {onFocus: () => void}}) => React.ReactNode
      label: string
    }) => (
      <View accessibilityLabel={label} accessibilityHint="">
        {children({props: {onFocus() {}}})}
      </View>
    ),
    Outer: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    Group: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    Divider: () => <View testID="divider" />,
    Item: ({
      children,
      label,
      disabled,
      onPress,
    }: {
      children: React.ReactNode
      label: string
      disabled?: boolean
      onPress: () => void
    }) => (
      <Pressable
        accessibilityRole="menuitem"
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityState={{disabled: !!disabled}}
        disabled={disabled}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ItemText: Text,
    ItemIcon: ({icon}: {icon: {name: string}}) => (
      <Text testID="menuIcon">{icon.name}</Text>
    ),
  }
})

const author: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
  handle: 'author.test',
}

const REPO = 'at://did:plc:6ayddqghxhciedbaofoxkcbs'
const documentRef = {
  uri: `${REPO}/${site.standard.document.$type}/3kdoc`,
  cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
}
const publicationRef = {
  uri: `${REPO}/${site.standard.publication.$type}/3kpub`,
  cid: 'bafyreig3yg2msah74sgvow25uxddqbabex3f3mh6hysess3w5kmgiv6zqy',
}
const view = {
  uri: 'https://example.com/thing',
  title: 'A thing',
  description: '',
}
type Ref = {uri: string; cid: string}
const galleryRef = {
  uri: `${REPO}/${social.grain.gallery.$type}/3kgallery`,
  cid: documentRef.cid,
}
const photoRef = {
  uri: `${REPO}/${social.grain.photo.$type}/3kphoto`,
  cid: publicationRef.cid,
}
const livestreamRef = {
  uri: `${REPO}/${place.stream.livestream.$type}/3klive`,
  cid: documentRef.cid,
}
const associatedRefs = [
  publicationRef,
  photoRef,
  galleryRef,
  livestreamRef,
  documentRef,
]
const items = {
  article: {...view, associatedRefs},
  photo: {...view, items: [], associatedRefs},
  publication: {...view, associatedRefs},
  livestream: {...view, active: false, associatedRefs},
}
type MenuType = keyof typeof items
const defaultReportableTypes: Record<MenuType, string> = {
  article: site.standard.document.$type,
  photo: social.grain.gallery.$type,
  publication: site.standard.publication.$type,
  livestream: place.stream.livestream.$type,
}

function renderMenu(
  type: MenuType,
  overrides: {associatedRefs?: Ref[]} = {},
  children?: React.ReactNode,
  reportableTypes: readonly string[] = [defaultReportableTypes[type]],
  withAuthor = true,
  style?: React.ComponentProps<typeof AtmosphereCardMenu>['style'],
) {
  const props = {
    type,
    item: {...items[type], ...overrides},
    reportableTypes,
    author: withAuthor ? author : undefined,
    style,
    children,
  } as unknown as React.ComponentProps<typeof AtmosphereCardMenu>
  return render(<AtmosphereCardMenu {...props} />)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe.each([
  [
    'article',
    'Article options',
    'View article',
    'Report article',
    'Report this article',
    documentRef,
  ],
  [
    'photo',
    'Photo options',
    'View photo',
    'Report photo',
    'Report this gallery',
    galleryRef,
  ],
  [
    'publication',
    'Publication options',
    'View publication',
    'Report publication',
    'Report this publication',
    publicationRef,
  ],
  [
    'livestream',
    'Livestream options',
    'View livestream',
    'Report livestream',
    'Report this livestream',
    livestreamRef,
  ],
] as const)(
  'AtmosphereCardMenu %s',
  (type, trigger, viewLabel, fallback, reportLabel, record) => {
    const labels = () =>
      screen.getAllByRole('menuitem').map(i => i.props.accessibilityLabel)

    const allowedCollection = defaultReportableTypes[type]

    it('omits the profile action without an author', () => {
      renderMenu(type, {}, undefined, undefined, false)

      expect(labels()).toEqual([viewLabel, reportLabel])
    })

    it('lists only the record types allowed by the callsite', () => {
      renderMenu(type)

      expect(
        screen.getByTestId('atmosphereCardMenuTrigger').props
          .accessibilityLabel,
      ).toBe(trigger)
      expect(labels()).toEqual([viewLabel, 'View author profile', reportLabel])
    })

    it('opens the external uri', () => {
      renderMenu(type)

      fireEvent.press(screen.getByLabelText(viewLabel))
      expect(mockOpenLink).toHaveBeenCalledWith(view.uri)
    })

    it('navigates to the author by DID', () => {
      renderMenu(type)

      fireEvent.press(screen.getByLabelText('View author profile'))
      expect(mockNavigate).toHaveBeenCalledWith('Profile', {name: author.did})
    })

    it('opens the dialog with exactly the allowed record', () => {
      renderMenu(type)

      const item = screen.getByLabelText(reportLabel)
      expect(item).toBeEnabled()
      fireEvent.press(item)
      expect(mockOpenReport).toHaveBeenCalledTimes(1)
      expect(mockOpenReport).toHaveBeenCalledWith({
        subject: {$type: 'com.atproto.repo.strongRef', ...record},
      })
    })

    it.each(['app.test.thing', `${allowedCollection}.extra`])(
      'does not offer unlisted collection %s',
      collection => {
        const unlisted = {
          uri: `${REPO}/${collection}/3kabc`,
          cid: documentRef.cid,
        }
        renderMenu(type, {associatedRefs: [unlisted, unlisted]})

        expect(labels()).toEqual([viewLabel, 'View author profile', fallback])
        expect(screen.getByLabelText(fallback)).toBeDisabled()
      },
    )

    it.each([
      ['no refs', undefined],
      ['empty refs', []],
      ['only invalid refs', [{uri: 'https://example.com/thing', cid: 'nope'}]],
    ])('disables Report and keeps it inert with %s', (_name, refs) => {
      renderMenu(type, {associatedRefs: refs})

      const item = screen.getByLabelText(fallback)
      expect(item).toBeDisabled()
      fireEvent.press(item)
      expect(mockOpenReport).not.toHaveBeenCalled()
    })
  },
)

it('puts view, profile and report icons on the menu items', () => {
  renderMenu('photo')

  expect(
    screen.getAllByTestId('menuIcon').map(icon => icon.props.children),
  ).toEqual([
    'SquareArrowTopRight_Stroke2_Corner0_Rounded',
    'Person_Stroke2_Corner0_Rounded',
    'Warning_Stroke2_Corner0_Rounded',
  ])
})

it('places extra children after the profile item and before Report', () => {
  renderMenu(
    'article',
    {},
    <Text
      accessibilityRole="menuitem"
      accessibilityLabel="Extra"
      accessibilityHint=""
    />,
  )

  expect(
    screen.getAllByRole('menuitem').map(i => i.props.accessibilityLabel),
  ).toEqual([
    'View article',
    'View author profile',
    'Extra',
    'Report this article',
  ])
})

it('uses the explicit callsite allowlist rather than inferring it from the card', () => {
  renderMenu('article', {}, undefined, [social.grain.gallery.$type])

  expect(screen.queryByLabelText('Report this article')).toBeNull()
  fireEvent.press(screen.getByLabelText('Report this gallery'))
  expect(mockOpenReport).toHaveBeenCalledWith({
    subject: {$type: 'com.atproto.repo.strongRef', ...galleryRef},
  })
})

it('does not offer reports when the callsite allows no record types', () => {
  renderMenu('article', {}, undefined, [])

  expect(screen.getByLabelText('Report article')).toBeDisabled()
  expect(screen.queryByLabelText('Report this article')).toBeNull()
})

describe('wrapper position', () => {
  const wrapperStyle = () =>
    StyleSheet.flatten(
      (screen.toJSON() as unknown as {props: {style: object}}).props.style,
    )

  it('defaults to an 8px top-right inset', () => {
    renderMenu('article')

    expect(wrapperStyle()).toMatchObject({top: 8, right: 8})
  })

  it('lets a caller override the inset', () => {
    renderMenu('article', {}, undefined, undefined, true, {top: 0, right: 0})

    expect(wrapperStyle()).toMatchObject({top: 0, right: 0})
  })
})
