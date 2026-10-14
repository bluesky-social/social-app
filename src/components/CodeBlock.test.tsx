import {
  type PressableProps,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, waitFor} from '@testing-library/react-native'

import {MONOSPACE_FONT_FAMILY} from '#/alf/fonts'
import {CodeBlock, InlineCodeText} from '#/components/CodeBlock'
import * as Toast from '#/components/Toast'
import * as env from '#/env'

const mockInitialize = jest.fn<Promise<void>, []>()
const mockTokenize = jest.fn()
let mockIsReady = false
let mockScheme = 'light'
let mockWeb = false

jest.mock('#/storage', () => ({device: {get: jest.fn(), set: jest.fn()}}))
jest.mock('#/env', () => ({
  ...jest.requireActual('#/env'),
  __esModule: true,
  IS_ANDROID: false,
}))
jest.mock('expo-clipboard', () => ({setStringAsync: jest.fn()}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/lib/shiki/HighlighterContext', () => ({
  useHighlighter: () => ({
    initialize: mockInitialize,
    tokenize: mockTokenize,
    isReady: mockIsReady,
  }),
}))
jest.mock('#/alf', () => ({
  MONOSPACE_FONT_FAMILY:
    jest.requireActual<typeof import('#/alf/fonts')>('#/alf/fonts')
      .MONOSPACE_FONT_FAMILY,
  atoms: {rounded_sm: {borderRadius: 4}},
  web: (value: unknown) => (mockWeb ? value : undefined),
  native: (value: unknown) => (mockWeb ? undefined : value),
  useTheme: () => ({
    name: mockScheme,
    scheme: mockScheme,
    atoms: {bg: {backgroundColor: '#fff'}},
  }),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text: ButtonText} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      children,
      ...props
    }: React.PropsWithChildren<PressableProps & {label: string}>) => (
      <Pressable
        accessibilityLabel={label}
        accessibilityHint={undefined}
        {...props}>
        {children}
      </Pressable>
    ),
    ButtonText,
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

function renderInline(props: React.ComponentProps<typeof InlineCodeText>) {
  return render(
    <I18nProvider i18n={i18n}>
      <InlineCodeText {...props} />
    </I18nProvider>,
  )
}

function press(element: Parameters<typeof fireEvent.press>[0]) {
  const event = {preventDefault: jest.fn(), stopPropagation: jest.fn()}
  fireEvent.press(element, event)
  expect(event.preventDefault).toHaveBeenCalledTimes(1)
  expect(event.stopPropagation).toHaveBeenCalledTimes(1)
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.replaceProperty(env, 'IS_ANDROID', false)
  jest.mocked(Clipboard.setStringAsync).mockResolvedValue(true)
  mockInitialize.mockResolvedValue(undefined)
  mockTokenize.mockReturnValue([[{content: 'source', color: '#123456'}]])
  mockIsReady = false
  mockScheme = 'light'
  mockWeb = false
})

it.each([
  ['block', renderBlock],
  ['inline', renderInline],
] as const)(
  'leaves the clipboard unchanged for NUL in Android %s code',
  async (_name, renderCode) => {
    jest.replaceProperty(env, 'IS_ANDROID', true)
    const screen = renderCode({
      code: 'a\u0000b\uFFFDc',
      displayCode: 'a\uFFFDb\uFFFDc',
    })
    press(screen.getByLabelText('Copy code'))
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith('Unable to copy code', {
        type: 'error',
      }),
    )
  },
)

it('passes source NUL through on other platforms', async () => {
  const code = 'a\u0000b\uFFFDc'
  const screen = renderInline({code})
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
  await waitFor(() =>
    expect(Toast.show).toHaveBeenCalledWith('Copied to clipboard', {
      type: 'success',
    }),
  )
})

it('shows success only after the clipboard write resolves', async () => {
  let resolveCopy!: (copied: boolean) => void
  jest
    .mocked(Clipboard.setStringAsync)
    .mockImplementationOnce(
      () => new Promise(resolve => (resolveCopy = resolve)),
    )
  const screen = renderBlock({code: 'source\r\n'})
  press(screen.getByLabelText('Copy code'))
  expect(Toast.show).not.toHaveBeenCalled()
  resolveCopy(true)
  await waitFor(() =>
    expect(Toast.show).toHaveBeenCalledWith('Copied to clipboard', {
      type: 'success',
    }),
  )
})

it.each(['false result', 'rejected promise'])(
  'reports clipboard failure for a %s',
  async failure => {
    if (failure === 'false result') {
      jest.mocked(Clipboard.setStringAsync).mockResolvedValueOnce(false)
    } else {
      jest
        .mocked(Clipboard.setStringAsync)
        .mockRejectedValueOnce(new Error('Clipboard unavailable'))
    }
    const screen = renderBlock({code: 'source'})
    press(screen.getByLabelText('Copy code'))
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith('Unable to copy code', {
        type: 'error',
      }),
    )
    expect(Toast.show).not.toHaveBeenCalledWith('Copied to clipboard', {
      type: 'success',
    })
  },
)

it.each(['source\n', 'source\r\n', '  source\r\n\r\n'])(
  'copies the exact payload %j while initialization is unavailable',
  async code => {
    mockInitialize.mockRejectedValueOnce(new Error('Engine unavailable'))
    const screen = renderBlock({code, displayCode: 'source'})
    await waitFor(() => expect(mockInitialize).toHaveBeenCalledTimes(1))

    expect(screen.getByTestId('code-block').type).toBe('View')
    expect(screen.getByText('source')).toBeTruthy()
    press(screen.getByLabelText('Copy code'))
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
    expect(mockTokenize).not.toHaveBeenCalled()
  },
)

it('keeps Copy available and preserves the existing collapse interaction', () => {
  const code = Array.from({length: 21}, () => 'line').join('\n')
  const screen = renderBlock({code})
  press(screen.getByLabelText('Show more'))
  expect(screen.getByLabelText('Show less')).toBeTruthy()
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
  press(screen.getByLabelText('Show less'))
  expect(screen.getByLabelText('Show more')).toBeTruthy()
})

it.each(['source\n', 'source\r\n', 'source\r'])(
  'uses a compact one-line display for %j without changing Copy',
  code => {
    const screen = renderBlock({code, lang: 'javascript'})
    expect(screen.getByText('source')).toBeTruthy()
    expect(screen.queryByText('javascript')).toBeNull()
    expect(screen.getByText('source').props.children).toBe('source')
    const style =
      StyleSheet.flatten<TextStyle>(screen.getByText('source').props.style) ??
      {}
    expect(style.minHeight).toBe(44)
    expect(style.paddingRight).toBe(64)
    press(screen.getByLabelText('Copy code'))
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
  },
)

it('removes only one terminal line ending while preserving blank lines', () => {
  const code = 'first\r\n\r\nlast\r\n\r\n'
  const screen = renderBlock({code})
  expect(screen.getByText('first\n\nlast\n').props.children).toBe(
    'first\n\nlast\n',
  )
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
})

it.each(['\n', '\r\n', '\r'])(
  'normalizes display line endings %j while copying the original Unicode source',
  ending => {
    const glyphs = '\t👩🏽‍💻 e\u0301 世界'
    const code = `first${ending}${glyphs}${ending}${ending}`
    mockIsReady = true
    mockTokenize.mockImplementationOnce((visible: string) =>
      visible.split('\n').map(content => [{content}]),
    )
    const screen = renderBlock({code, lang: 'js'})
    expect(mockTokenize).toHaveBeenCalledWith(`first\n${glyphs}\n`, {
      lang: 'js',
      theme: 'bluesky-light',
    })
    expect(screen.getByText(glyphs)).toBeTruthy()
    press(screen.getByLabelText('Copy code'))
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
  },
)

it('collapses and expands more than 20 CR-only lines', () => {
  const code = Array.from({length: 21}, () => 'line').join('\r')
  const screen = renderBlock({code})
  press(screen.getByLabelText('Show more'))
  expect(screen.getByLabelText('Show less')).toBeTruthy()
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code)
  press(screen.getByLabelText('Show less'))
  expect(screen.getByLabelText('Show more')).toBeTruthy()
})

it('reserves measured space for a wider or taller localized Copy control', () => {
  const screen = renderBlock({code: 'source'})
  fireEvent(screen.getByTestId('code-copy-control'), 'layout', {
    nativeEvent: {layout: {width: 100, height: 40}},
  })
  const style =
    StyleSheet.flatten<TextStyle>(screen.getByText('source').props.style) ?? {}
  expect(style.paddingRight).toBe(116)
  expect(style.minHeight).toBe(56)
})

it.each([
  ['light', 'bluesky-light'],
  ['dark', 'bluesky-dark'],
  ['dim', 'bluesky-dim'],
])('uses the %s theme and monospace on every token text', (scheme, theme) => {
  mockIsReady = true
  mockScheme = scheme
  const screen = renderBlock({
    code: 'raw\r\n',
    displayCode: 'source',
    lang: 'js',
    textStyle: {fontSize: 18, flex: 1, padding: 10},
  })
  expect(mockTokenize).toHaveBeenCalledWith('source', {lang: 'js', theme})

  const sourceText = screen.getByText('source')
  let text: typeof sourceText | null = sourceText
  while (text) {
    if (text.type === Text || String(text.type) === 'Text') {
      const style = StyleSheet.flatten<TextStyle>(text.props.style) ?? {}
      expect(style.fontFamily).toBe(MONOSPACE_FONT_FAMILY)
      expect(style.fontSize).toBe(18)
      expect(style.flex).toBeUndefined()
      expect(text.props.selectable).toBe(true)
    }
    text = text.parent
  }
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith('raw\r\n')
})

it('renders selectable inline display text and copies the raw interior', async () => {
  const screen = renderInline({
    code: ' a\nb ',
    displayCode: 'a b',
    textStyle: {fontFamily: 'Inter', flex: 1},
    selectable: true,
  })
  const inline = screen.getByTestId('inline-code')
  const style = StyleSheet.flatten<TextStyle>(inline.props.style) ?? {}
  const children = inline.props.children as React.ReactNode[]
  expect(inline.type).toBe('Text')
  expect(children[0]).toBe('a b')
  expect(style.fontFamily).toBe(MONOSPACE_FONT_FAMILY)
  expect(style.flex).toBeUndefined()
  expect(inline.props.selectable).toBe(true)
  press(screen.getByLabelText('Copy code'))
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(' a\nb ')
  await waitFor(() =>
    expect(Toast.show).toHaveBeenCalledWith('Copied to clipboard', {
      type: 'success',
    }),
  )
  expect(mockInitialize).not.toHaveBeenCalled()
})

it('keeps the native inline control as a small adjacent View attachment', () => {
  const screen = renderInline({code: 'source'})
  const control = screen.getByTestId('code-copy-control')
  const style = StyleSheet.flatten<ViewStyle>(control.props.style) ?? {}
  expect(control.type).toBe('View')
  expect(style.marginStart).toBe(4)
  expect(style.position).toBeUndefined()
})

it('reserves measured width and height for the floating inline web control', () => {
  mockWeb = true
  const screen = renderInline({code: 'source'})
  fireEvent(screen.getByTestId('code-copy-control'), 'layout', {
    nativeEvent: {layout: {width: 100, height: 40}},
  })
  const inline = screen.getByTestId('inline-code')
  const style = StyleSheet.flatten<TextStyle>(inline.props.style) ?? {}
  expect(style.paddingRight).toBe(108)
  expect(style.minHeight).toBe(40)
  expect(inline.props.dataSet).toEqual({codeInline: 1})
  expect(
    (
      StyleSheet.flatten<ViewStyle>(
        screen.getByTestId('code-copy-control').props.style,
      ) ?? {}
    ).position,
  ).toBe('absolute')
})

it.each(['false result', 'rejected promise'])(
  'uses the shared inline Copy failure feedback for a %s',
  async failure => {
    if (failure === 'false result') {
      jest.mocked(Clipboard.setStringAsync).mockResolvedValueOnce(false)
    } else {
      jest
        .mocked(Clipboard.setStringAsync)
        .mockRejectedValueOnce(new Error('Clipboard unavailable'))
    }
    const screen = renderInline({code: ' a\r\nb ', displayCode: 'a b'})
    press(screen.getByLabelText('Copy code'))
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(' a\r\nb ')
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith('Unable to copy code', {
        type: 'error',
      }),
    )
  },
)
