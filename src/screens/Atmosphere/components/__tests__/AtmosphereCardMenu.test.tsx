import {Text} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {AtmosphereCardMenu} from '../AtmosphereCardMenu'

const mockOpenLink = jest.fn()
const mockNavigate = jest.fn()

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

beforeEach(() => {
  jest.clearAllMocks()
})

describe.each([
  ['article', 'Article options', 'View article', 'Report article'],
  ['photo', 'Photo options', 'View photo', 'Report photo'],
] as const)('AtmosphereCardMenu %s', (type, trigger, view, report) => {
  it('labels the trigger and lists view, profile and report in order', () => {
    render(
      <AtmosphereCardMenu
        type={type}
        uri="https://example.com/thing"
        author={author}
      />,
    )

    expect(
      screen.getByTestId('atmosphereCardMenuTrigger').props.accessibilityLabel,
    ).toBe(trigger)
    expect(
      screen.getAllByRole('menuitem').map(i => i.props.accessibilityLabel),
    ).toEqual([view, 'View author profile', report])
  })

  it('opens the external uri', () => {
    render(
      <AtmosphereCardMenu
        type={type}
        uri="https://example.com/thing"
        author={author}
      />,
    )

    fireEvent.press(screen.getByLabelText(view))
    expect(mockOpenLink).toHaveBeenCalledWith('https://example.com/thing')
  })

  it('navigates to the author by DID', () => {
    render(
      <AtmosphereCardMenu
        type={type}
        uri="https://example.com/thing"
        author={author}
      />,
    )

    fireEvent.press(screen.getByLabelText('View author profile'))
    expect(mockNavigate).toHaveBeenCalledWith('Profile', {name: author.did})
  })

  it('renders Report disabled and inert', () => {
    render(
      <AtmosphereCardMenu
        type={type}
        uri="https://example.com/thing"
        author={author}
      />,
    )

    const item = screen.getByLabelText(report)
    expect(item).toBeDisabled()
    fireEvent.press(item)
    expect(mockOpenLink).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

it('puts view, profile and report icons on the menu items', () => {
  render(
    <AtmosphereCardMenu type="photo" uri="https://x.test" author={author} />,
  )

  expect(
    screen.getAllByTestId('menuIcon').map(icon => icon.props.children),
  ).toEqual([
    'SquareArrowTopRight_Stroke2_Corner0_Rounded',
    'Person_Stroke2_Corner0_Rounded',
    'Warning_Stroke2_Corner0_Rounded',
  ])
})

it('places extra children after the profile item and before Report', () => {
  render(
    <AtmosphereCardMenu type="article" uri="https://x.test" author={author}>
      <Text
        accessibilityRole="menuitem"
        accessibilityLabel="Extra"
        accessibilityHint=""
      />
    </AtmosphereCardMenu>,
  )

  expect(
    screen.getAllByRole('menuitem').map(i => i.props.accessibilityLabel),
  ).toEqual(['View article', 'View author profile', 'Extra', 'Report article'])
})
