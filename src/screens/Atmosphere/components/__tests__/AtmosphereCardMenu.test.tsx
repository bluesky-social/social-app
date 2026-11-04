import {Text} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
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
  parseReportSubject: jest.requireActual<
    typeof import('#/components/moderation/ReportDialog/utils/parseReportSubject')
  >('#/components/moderation/ReportDialog/utils/parseReportSubject')
    .parseReportSubject,
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

const ref = {
  uri: 'at://did:plc:6ayddqghxhciedbaofoxkcbs/app.test.thing/3kabc',
  cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
}
const view = {
  uri: 'https://example.com/thing',
  title: 'A thing',
  description: '',
}
type Ref = {uri: string; cid: string}
const article = {...view, associatedRefs: [ref]}
const photo = {...view, items: [], associatedRefs: [ref]}

function renderMenu(
  type: 'article' | 'photo',
  overrides: {associatedRefs?: Ref[]} = {},
  children?: React.ReactNode,
) {
  return render(
    type === 'article' ? (
      <AtmosphereCardMenu
        type="article"
        item={{...article, ...overrides} as app.bsky.embed.external.ViewArticle}
        author={author}>
        {children}
      </AtmosphereCardMenu>
    ) : (
      <AtmosphereCardMenu
        type="photo"
        item={{...photo, ...overrides} as app.bsky.embed.external.ViewGallery}
        author={author}>
        {children}
      </AtmosphereCardMenu>
    ),
  )
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
    'app.bsky.embed.external#viewArticle',
  ],
  [
    'photo',
    'Photo options',
    'View photo',
    'Report photo',
    'app.bsky.embed.external#viewGallery',
  ],
] as const)(
  'AtmosphereCardMenu %s',
  (type, trigger, viewLabel, report, $type) => {
    it('labels the trigger and lists view, profile and report in order', () => {
      renderMenu(type)

      expect(
        screen.getByTestId('atmosphereCardMenuTrigger').props
          .accessibilityLabel,
      ).toBe(trigger)
      expect(
        screen.getAllByRole('menuitem').map(i => i.props.accessibilityLabel),
      ).toEqual([viewLabel, 'View author profile', report])
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

    it('opens the report dialog with the typed original view', () => {
      renderMenu(type)

      const item = screen.getByLabelText(report)
      expect(item).toBeEnabled()
      fireEvent.press(item)
      expect(mockOpenReport).toHaveBeenCalledTimes(1)
      expect(mockOpenReport).toHaveBeenCalledWith({
        subject: expect.objectContaining({
          $type,
          uri: view.uri,
          associatedRefs: [ref],
        }),
      })
    })

    it.each([
      ['no refs', undefined],
      ['empty refs', []],
      ['only invalid refs', [{uri: 'https://example.com/thing', cid: 'nope'}]],
    ])(
      'disables Report and keeps it inert with %s',
      (_name, associatedRefs) => {
        renderMenu(type, {associatedRefs})

        const item = screen.getByLabelText(report)
        expect(item).toBeDisabled()
        fireEvent.press(item)
        expect(mockOpenReport).not.toHaveBeenCalled()
      },
    )
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
  ).toEqual(['View article', 'View author profile', 'Extra', 'Report article'])
})
