import {fireEvent, render, screen} from '@testing-library/react-native'

import * as Menu from '#/components/Menu'
import {type app, place, site, social} from '#/lexicons'
import {AtmosphereCardMenu} from '../AtmosphereCardMenu'

const mockOpenLink = jest.fn()
const mockNavigate = jest.fn()
const mockOpenReport = jest.fn()
const mockShareUrl = jest.fn()
const mockOpenComposer = jest.fn()
const mockRequireAuth = jest.fn((fn: () => unknown) => fn())
const mockOpenSendViaChat = jest.fn()
let mockHasSession = true
let mockHasFullAccess = true
let mockIsWeb = false

/* Report availability relies on real CID validation, which the repo mocks. */
jest.unmock('multiformats/cid')
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string}) => value.message,
    i18n: {number: String},
  }),
}))
jest.mock('#/alf', () => ({atoms: new Proxy({}, {get: () => ({})})}))
jest.mock('#/env', () => ({
  get IS_WEB() {
    return mockIsWeb
  },
}))
jest.mock('#/lib/hooks/useOpenLink', () => ({
  useOpenLink: () => mockOpenLink,
}))
jest.mock('#/lib/hooks/useOpenComposer', () => ({
  useOpenComposer: () => ({openComposer: mockOpenComposer}),
}))
let mockDevMode = false
const mockSetString = jest.fn()
jest.mock('#/storage/hooks/dev-mode', () => ({
  useDevMode: () => [mockDevMode],
}))
jest.mock('expo-clipboard', () => ({
  setStringAsync: (value: string) => mockSetString(value),
}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/components/icons/Clipboard', () => ({
  Clipboard_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/lib/sharing', () => ({
  shareUrl: (url: string) => mockShareUrl(url),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: mockHasSession}),
  useRequireAuth: () => mockRequireAuth,
}))
jest.mock('#/ageAssurance', () => ({
  useAgeAssurance: () => ({
    Access: {Full: 'full', Limited: 'limited'},
    state: {access: mockHasFullAccess ? 'full' : 'limited'},
  }),
}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpenSendViaChat}),
}))
/* Selecting a conversation is stubbed; the real picker needs network providers. */
jest.mock('#/components/dms/dialogs/ShareViaChatDialog', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    SendViaChatDialog: ({
      onSelectChat,
    }: {
      onSelectChat: (conversation: string) => void
    }) => (
      <Pressable
        testID="selectChat"
        accessibilityHint=""
        accessibilityLabel="Select chat"
        onPress={() => onSelectChat('convo-1')}
      />
    ),
  }
})
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}))
jest.mock('#/components/moderation/ReportDialog', () => ({
  getAssociatedReportSubjects: jest.requireActual<
    typeof import('#/components/moderation/ReportDialog/utils/parseReportSubject')
  >('#/components/moderation/ReportDialog/utils/parseReportSubject')
    .getAssociatedReportSubjects,
  useGetCopyForSubject: jest.requireActual<
    typeof import('#/components/moderation/ReportDialog/copy')
  >('#/components/moderation/ReportDialog/copy').useGetCopyForSubject,
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
jest.mock('#/components/icons/ArrowOutOfBox', () => ({
  ArrowOutOfBoxModified_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/components/icons/brands/Mark', () => ({
  Mark: () => null,
}))
jest.mock('#/components/icons/ChainLink', () => ({
  ChainLink_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/PaperPlane', () => ({
  PaperPlane_Stroke2_Corner0_Rounded: () => null,
}))
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
  const {Children, isValidElement} =
    jest.requireActual<typeof import('react')>('react')
  /* Lowercase so the React Compiler doesn't instrument it inside the factory. */
  const menuItem = ({
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
  )
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
    /*
     * Mirrors the native Group, which drops any child that isn't a direct
     * Menu.Item, so wrapped items fail here as they would on device.
     */
    Group: ({children}: {children: React.ReactNode}) => (
      <View>
        {Children.toArray(children).filter(
          child => isValidElement(child) && child.type === menuItem,
        )}
      </View>
    ),
    Divider: () => <View testID="divider" />,
    Item: menuItem,
    ItemText: Text,
    ItemIcon: () => null,
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
const sharingLabels = ['Share', 'Create post', 'Send via chat']
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
) {
  const props = {
    type,
    item: {...items[type], ...overrides},
    reportableTypes,
    author: withAuthor ? author : undefined,
    children,
  } as unknown as React.ComponentProps<typeof AtmosphereCardMenu>
  return render(<AtmosphereCardMenu {...props} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockHasSession = true
  mockHasFullAccess = true
  mockIsWeb = false
  mockDevMode = false
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

      expect(labels()).toEqual([...sharingLabels, viewLabel, reportLabel])
    })

    it('lists only the record types allowed by the callsite', () => {
      renderMenu(type)

      expect(
        screen.getByTestId('atmosphereCardMenuTrigger').props
          .accessibilityLabel,
      ).toBe(trigger)
      expect(labels()).toEqual([
        ...sharingLabels,
        viewLabel,
        'View author profile',
        reportLabel,
      ])
    })

    it('shares the external uri', () => {
      renderMenu(type)

      fireEvent.press(screen.getByLabelText('Share'))
      expect(mockShareUrl).toHaveBeenCalledWith(view.uri)
    })

    it('opens the composer with the external uri after the auth check', () => {
      renderMenu(type)

      fireEvent.press(screen.getByLabelText('Create post'))
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockOpenComposer).toHaveBeenCalledWith({
        text: view.uri,
        logContext: 'Other',
      })
    })

    it('stages the external uri as chat text, not as an embed', () => {
      renderMenu(type)

      fireEvent.press(screen.getByLabelText('Send via chat'))
      expect(mockOpenSendViaChat).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()

      fireEvent.press(screen.getByTestId('selectChat'))
      expect(mockNavigate).toHaveBeenCalledWith('MessagesConversation', {
        conversation: 'convo-1',
        text: view.uri,
      })
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

        expect(labels()).toEqual([
          ...sharingLabels,
          viewLabel,
          'View author profile',
          fallback,
        ])
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

it('places extra children after the profile item and before Report', () => {
  renderMenu(
    'article',
    {},
    <Menu.Item label="Extra" onPress={() => {}}>
      <Menu.ItemText>Extra</Menu.ItemText>
    </Menu.Item>,
  )

  expect(
    screen.getAllByRole('menuitem').map(i => i.props.accessibilityLabel),
  ).toEqual([
    ...sharingLabels,
    'View article',
    'View author profile',
    'Extra',
    'Report this article',
  ])
})

it('labels the first sharing action Copy link on web', () => {
  mockIsWeb = true
  renderMenu('article')

  expect(screen.queryByLabelText('Share')).toBeNull()
  fireEvent.press(screen.getByLabelText('Copy link'))
  expect(mockShareUrl).toHaveBeenCalledWith(view.uri)
})

it('hides chat when logged out and gates Create post on auth', () => {
  mockHasSession = false
  mockRequireAuth.mockImplementationOnce(() => {})
  renderMenu('article')

  expect(screen.queryByLabelText('Send via chat')).toBeNull()
  fireEvent.press(screen.getByLabelText('Create post'))
  expect(mockRequireAuth).toHaveBeenCalledTimes(1)
  expect(mockOpenComposer).not.toHaveBeenCalled()
})

it('hides chat without full age assurance access', () => {
  mockHasFullAccess = false
  renderMenu('article')

  expect(screen.queryByLabelText('Send via chat')).toBeNull()
  expect(screen.getByLabelText('Share')).toBeTruthy()
  expect(screen.getByLabelText('Create post')).toBeTruthy()
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

describe('AtmosphereCardMenu dev mode', () => {
  const copyLabels = () =>
    screen
      .queryAllByRole('menuitem')
      .map(i => i.props.accessibilityLabel)
      .filter(
        (label: string) => label.startsWith('Copy') && /AT URI/.test(label),
      )

  it('hides the copy actions unless dev mode is on', () => {
    renderMenu('article')
    expect(copyLabels()).toEqual([])
  })

  it.each([
    ['article', ['Copy publication AT URI', 'Copy article AT URI']],
    ['photo', ['Copy gallery AT URI']],
    ['publication', ['Copy publication AT URI']],
    ['livestream', ['Copy livestream AT URI']],
  ] as const)('offers only the %s records', (type, expected) => {
    mockDevMode = true
    renderMenu(type)
    expect(copyLabels()).toEqual(expected)
  })

  it('copies the record uri', () => {
    mockDevMode = true
    renderMenu('photo')
    fireEvent.press(screen.getByLabelText('Copy gallery AT URI'))
    expect(mockSetString).toHaveBeenCalledWith(galleryRef.uri)
  })
})
