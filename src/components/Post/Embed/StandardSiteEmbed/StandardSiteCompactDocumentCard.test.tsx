import {type StyleProp, type ViewStyle} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {StandardSiteCompactDocumentCard} from './StandardSiteCompactDocumentCard'

type LinkContext = {
  focused: boolean
  hovered: boolean
  interacting: boolean
  pressed: boolean
  disabled: boolean
}

type LinkMockProps = {
  children: React.ReactNode | ((context: LinkContext) => React.ReactNode)
  label: string
  to: string
  style?: StyleProp<ViewStyle>
}

type ChildrenProps = {children?: React.ReactNode}
type ButtonMockProps = ChildrenProps & {
  accessibilityLabel?: string
  label: string
  onPress?: () => void
  testID?: string
}
type MenuTriggerProps = {
  children: (value: {
    props: {
      accessibilityLabel: string
      onPress: () => void
    }
  }) => React.ReactNode
  label: string
}
type MenuItemProps = ChildrenProps & {
  disabled?: boolean
  label: string
  onPress: () => void
}

const mockOpenLink = jest.fn()
const mockNavigate = jest.fn()
const mockOpenReportDialog = jest.fn()

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({
    atoms: {
      bg_contrast_25: {},
      bg_contrast_50: {},
      text_contrast_medium: {},
    },
  }),
  web: (styles: unknown) => styles,
}))
jest.mock('expo-image', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Image: View}
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/lib/hooks/useOpenLink', () => ({
  useOpenLink: () => mockOpenLink,
}))
jest.mock('#/Navigation', () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
}))
jest.mock('#/view/com/util/EventStopper', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {EventStopper: ({children}: ChildrenProps) => <View>{children}</View>}
})
jest.mock('#/components/Button', () => {
  const {Pressable} =
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
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/Menu', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Root: ({children}: ChildrenProps) => <View>{children}</View>,
    Trigger: ({children, label}: MenuTriggerProps) => (
      <View>
        {children({
          props: {
            accessibilityLabel: label,
            onPress: () => {},
          },
        })}
      </View>
    ),
    Outer: ({children}: ChildrenProps) => <View>{children}</View>,
    Group: ({children}: ChildrenProps) => <View>{children}</View>,
    Divider: () => <View testID="menu-divider" />,
    Item: ({children, disabled, label, onPress}: MenuItemProps) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole="menuitem"
        disabled={disabled}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ItemText: ({children}: ChildrenProps) => <Text>{children}</Text>,
  }
})
jest.mock('#/components/moderation/ReportDialog', () => ({
  useGlobalReportDialogControl: () => ({open: mockOpenReportDialog}),
}))
jest.mock(
  '#/components/Post/Embed/StandardSiteEmbed/StandardSiteMetaRow',
  () => ({StandardSiteMetaRow: () => null}),
)
jest.mock('#/components/icons/Clock', () => ({
  Clock_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/DotGrid', () => ({
  DotGrid3x1_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Link', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')

  return {
    Link: ({children, label, to, style}: LinkMockProps) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole="link"
        style={style}
        testID={`link-${to}`}>
        {typeof children === 'function'
          ? children({
              focused: false,
              hovered: false,
              interacting: false,
              pressed: false,
              disabled: false,
            })
          : children}
      </Pressable>
    ),
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})

const author = {
  $type: 'app.bsky.actor.defs#profileViewBasic' as const,
  did: 'did:plc:author' as const,
  handle: 'author.example' as const,
}

const view: app.bsky.embed.external.ViewExternal = {
  $type: 'app.bsky.embed.external#viewExternal',
  uri: 'https://brookie.example/posts/one',
  thumb: 'https://cdn.example/thumb.jpg',
  title: 'A very long document title',
  description: 'A very long document description',
  source: {
    $type: 'app.bsky.embed.external#viewExternalSource',
    uri: 'https://brookie.example',
    title: 'Brookie Notes',
  },
  associatedRefs: [
    {
      uri: 'at://did:plc:author/site.standard.document/one',
      cid: 'bafy-document',
    },
  ],
  associatedProfiles: [author],
}

function renderCard(cardView?: app.bsky.embed.external.ViewExternal) {
  return render(
    <I18nProvider i18n={i18n}>
      <StandardSiteCompactDocumentCard view={cardView} />
    </I18nProvider>,
  )
}

describe('StandardSiteCompactDocumentCard', () => {
  beforeEach(() => {
    mockOpenLink.mockClear()
    mockNavigate.mockClear()
    mockOpenReportDialog.mockClear()
  })

  it('clamps the title and description and links the complete row', () => {
    const result = renderCard(view)

    expect(result.getByText(view.title).props.numberOfLines).toBe(2)
    expect(result.getByText(view.description).props.numberOfLines).toBe(2)
    expect(
      result.getByTestId('link-https://brookie.example/posts/one'),
    ).toBeTruthy()
  })

  it('offers publication, author, and report menu actions', () => {
    const result = renderCard(view)

    expect(result.getByRole('button', {name: 'More options'})).toBeTruthy()
    expect(result.getByTestId('menu-divider')).toBeTruthy()

    fireEvent.press(result.getByRole('menuitem', {name: 'View publication'}))
    expect(mockOpenLink).toHaveBeenCalledWith('https://brookie.example')

    fireEvent.press(result.getByRole('menuitem', {name: 'View author'}))
    expect(mockNavigate).toHaveBeenCalledWith({
      name: 'Profile',
      params: {name: 'author.example'},
    })

    fireEvent.press(result.getByRole('menuitem', {name: 'Report this'}))
    expect(mockOpenReportDialog).toHaveBeenCalledWith({
      subject: author,
    })
  })

  it('omits the thumbnail region when no thumbnail is available', () => {
    const result = renderCard({...view, thumb: undefined})

    expect(
      result.queryByTestId('standard-site-compact-document-thumbnail'),
    ).toBeNull()
  })

  it('preserves the thumbnail aspect ratio when a thumbnail is available', () => {
    const result = renderCard(view)
    const thumbnail = result.getByTestId(
      'standard-site-compact-document-thumbnail',
    )

    expect(thumbnail.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({aspectRatio: 16 / 9})]),
    )
  })

  it('renders an accessible non-linking fallback for an unavailable document', () => {
    const result = renderCard()

    expect(result.getByLabelText('Post unavailable')).toBeTruthy()
    expect(result.queryByRole('link')).toBeNull()
  })

  it('does not link a malformed view without a title', () => {
    const result = renderCard({...view, title: ' '})

    expect(result.getByLabelText('Post unavailable')).toBeTruthy()
    expect(result.queryByRole('link')).toBeNull()
  })
})
