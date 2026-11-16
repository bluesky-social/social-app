import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app as lexApp} from '#/lexicons'
import {AppDialog} from '../AppDialog'

const calls: string[] = []
const mockOpenLink = jest.fn((url: string) => calls.push(`open:${url}`))
const mockNavigate = jest.fn((...args: unknown[]) =>
  calls.push(`navigate:${JSON.stringify(args)}`),
)

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}))
jest.mock('#/lib/hooks/useOpenLink', () => ({
  useOpenLink: () => mockOpenLink,
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/MediaInsetBorder', () => ({
  MediaInsetBorder: () => null,
}))
jest.mock('#/components/icons/Square', () => ({
  SquareArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Button', () => ({
  ButtonText: ({children}: {children: React.ReactNode}) => children,
  ButtonIcon: () => null,
}))
jest.mock('#/components/Link', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    isClickEventWithMetaKey: () => false,
    Link: ({
      testID,
      onPress,
      children,
    }: {
      testID?: string
      onPress: (e: {preventDefault: () => void}) => void
      children: React.ReactNode
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="link"
        onPress={() => onPress({preventDefault: () => {}})}>
        {children}
      </Pressable>
    ),
  }
})
jest.mock('#/lib/routes/links', () => ({makeProfileLink: () => '/profile/x'}))
jest.mock('#/components/Dialog', () => ({
  Outer: ({children}: {children: React.ReactNode}) => children,
  Handle: () => null,
  Close: () => null,
  ScrollableInner: ({children}: {children: React.ReactNode}) => children,
  useDialogContext: () => ({
    close: (cb?: () => void) => {
      calls.push('close')
      cb?.()
    },
  }),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  web: () => ({}),
  useTheme: () => ({
    atoms: new Proxy({}, {get: () => ({})}),
    palette: new Proxy({}, {get: () => '#000'}),
  }),
}))

const app: lexApp.bsky.unspecced.getAtmosphereApps.AppCard = {
  id: 'app',
  title: 'Test app',
  description: 'A description',
  logo: 'https://example.com/logo.png',
  banner: 'https://example.com/banner.png',
  url: 'https://example.com/app',
  category: 'writing',
  profile: {did: 'did:plc:abc', handle: 'app.test'},
}

const control = {} as React.ComponentProps<typeof AppDialog>['control']

beforeEach(() => {
  jest.clearAllMocks()
  calls.length = 0
})

describe('AppDialog', () => {
  it('closes, then opens the app url', () => {
    render(<AppDialog control={control} app={app} />)
    fireEvent.press(screen.getByTestId('appDialogVisit'))
    expect(calls).toEqual(['close', `open:${app.url}`])
  })

  it('closes, then navigates to the profile', () => {
    render(<AppDialog control={control} app={app} />)
    fireEvent.press(screen.getByTestId('appDialogProfile'))
    expect(calls).toEqual([
      'close',
      `navigate:${JSON.stringify(['Profile', {name: 'did:plc:abc'}])}`,
    ])
  })

  it('hides Website without a url', () => {
    render(<AppDialog control={control} app={{...app, url: undefined}} />)
    expect(screen.queryByTestId('appDialogVisit')).toBeNull()
    expect(screen.getByTestId('appDialogProfile')).toBeTruthy()
  })

  it('hides View profile without a profile', () => {
    render(<AppDialog control={control} app={{...app, profile: undefined}} />)
    expect(screen.queryByTestId('appDialogProfile')).toBeNull()
  })

  it('shows the mapped category label, and omits unknown ones', () => {
    const {rerender} = render(<AppDialog control={control} app={app} />)
    expect(screen.getByText('Blogging')).toBeTruthy()
    rerender(<AppDialog control={control} app={{...app, category: 'nope'}} />)
    expect(screen.queryByText('Blogging')).toBeNull()
    expect(screen.queryByText('nope')).toBeNull()
  })
})
