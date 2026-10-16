import {type PressableProps, StyleSheet, type TextStyle} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {useCodeTokens} from '#/lib/shiki'
import {MONOSPACE_FONT_FAMILY} from '#/alf/fonts'
import {CodeBlock, InlineCode} from '#/components/CodeBlock'
import * as Toast from '#/components/Toast'

jest.mock('#/storage', () => ({device: {get: jest.fn(), set: jest.fn()}}))
jest.mock('expo-clipboard', () => ({setStringAsync: jest.fn()}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/lib/shiki', () => ({useCodeTokens: jest.fn()}))
jest.mock('#/alf', () => ({
  MONOSPACE_FONT_FAMILY:
    jest.requireActual<typeof import('#/alf/fonts')>('#/alf/fonts')
      .MONOSPACE_FONT_FAMILY,
  atoms: new Proxy({}, {get: () => ({})}),
  web: () => undefined,
  useTheme: () => ({name: 'light', atoms: {}}),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      ...props
    }: React.PropsWithChildren<PressableProps & {label: string}>) => (
      <Pressable
        accessibilityLabel={label}
        accessibilityHint={undefined}
        {...props}
      />
    ),
    ButtonText: Text,
  }
})

const i18n = setupI18n({locale: 'en', messages: {en: {}}})

function renderBlock(props: React.ComponentProps<typeof CodeBlock>) {
  return render(
    <I18nProvider i18n={i18n}>
      <CodeBlock {...props} />
    </I18nProvider>,
  )
}

/** Presses like a tap inside a post, which must not reach the post. */
function press(element: Parameters<typeof fireEvent.press>[0]) {
  const event = {preventDefault: jest.fn(), stopPropagation: jest.fn()}
  fireEvent.press(element, event)
  expect(event.stopPropagation).toHaveBeenCalled()
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useCodeTokens).mockReturnValue(null)
})

it('shows plain code with one kind of line ending while loading', () => {
  const screen = renderBlock({code: 'a\r\nb\rc', lang: 'js'})
  expect(screen.getByText('a\nb\nc')).toBeTruthy()
  expect(useCodeTokens).toHaveBeenCalledWith('a\nb\nc', 'js', 'light')
})

it('renders highlighted lines with their colors', () => {
  jest.mocked(useCodeTokens).mockReturnValue([
    [
      {content: 'const', color: '#0000ff', offset: 0},
      {content: ' a', color: '#000000', offset: 5},
    ],
    [],
    [{content: 'b', color: '#000000', offset: 9}],
  ])
  const screen = renderBlock({code: 'const a\n\nb'})
  const color = (text: string) =>
    StyleSheet.flatten<TextStyle>(screen.getByText(text).props.style)?.color

  expect(color('const')).toBe('#0000ff')
  expect(color(' a')).toBe('#000000')
  expect(
    screen.getByText('const a\n\nb', {normalizer: text => text}),
  ).toBeTruthy()
})

it('copies the original code', () => {
  const code = 'a\r\nb'
  const screen = renderBlock({code})
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
  expect(Toast.show).toHaveBeenCalledWith('Copied to clipboard', {
    type: 'success',
  })
})

it('renders inline code in the code font', () => {
  const screen = render(<InlineCode code="npm i" selectable />)
  const text = screen.getByText('npm i')
  expect(StyleSheet.flatten<TextStyle>(text.props.style)?.fontFamily).toBe(
    MONOSPACE_FONT_FAMILY,
  )
  expect(text.props.selectable).toBe(true)
})
