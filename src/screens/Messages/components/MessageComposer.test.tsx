import {fireEvent, render, screen} from '@testing-library/react-native'

import {MessageComposer} from './MessageComposer'

const mockSetParams = jest.fn()
const mockSaveDraft = jest.fn()
const mockClear = jest.fn()
const mockInsert = jest.fn()
const mockOnSendMessage = jest.fn()
let mockParams: {conversation: string; text?: string} = {conversation: 'c1'}
let mockDraft = ''
let mockNeedsEmailVerification = false

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string}) => value.message,
    i18n: {number: String},
  }),
}))
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({params: mockParams}),
  useNavigation: () => ({setParams: mockSetParams}),
}))
jest.mock('#/state/email-verification', () => ({
  useEmail: () => ({needsEmailVerification: mockNeedsEmailVerification}),
}))
jest.mock('#/state/messages/message-drafts', () => ({
  useMessageDraft: () => ({getDraft: () => mockDraft, clearDraft: () => {}}),
  useSaveMessageDraft: (text: string) => mockSaveDraft(text),
}))
jest.mock('#/components/dms/MessageReplies', () => ({
  useMessageReplies: () => ({replyTo: undefined, clearReply: () => {}}),
}))
jest.mock('#/lib/haptics', () => ({useHaptics: () => ({confirm: () => {}})}))
jest.mock('#/lib/custom-animations/PressableScale', () => ({
  PressableScale:
    jest.requireActual<typeof import('react-native')>('react-native').Pressable,
}))
jest.mock('#/alf', () => {
  const proxy = new Proxy({}, {get: () => ({})})
  return {
    atoms: proxy,
    useTheme: () => ({atoms: proxy, palette: proxy}),
    native: () => undefined,
    platform: (specifics: {native?: unknown; default?: unknown}) =>
      specifics.native ?? specifics.default,
    tokens: {space: {sm: 8}},
    utils: {alpha: () => '#000'},
  }
})
jest.mock('#/components/GlassView', () => ({
  GlassView:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('#/components/EmojiPicker', () => ({}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Toast', () => ({show: () => {}}))
jest.mock('#/components/icons/Emoji', () => ({
  EmojiArc_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/PaperPlane', () => ({
  PaperPlaneVertical_Filled_Stroke2_Corner1_Rounded: () => null,
}))
jest.mock('expo-glass-effect', () => ({
  GlassContainer:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('expo-linear-gradient', () => ({
  LinearGradient:
    jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('@bsky.app/expo-scroll-edge-effect', () => ({
  ScrollEdgeEffect: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('react-native-keyboard-controller', () => ({
  useKeyboardHandler: () => {},
  useReanimatedKeyboardAnimation: () => ({progress: {get: () => 0}}),
}))
jest.mock('react-native-worklets', () => ({scheduleOnRN: () => {}}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: jest.requireActual<typeof import('react-native')>('react-native')
      .View,
  },
  Extrapolation: {CLAMP: 'clamp'},
  interpolate: () => 0,
  useAnimatedStyle: () => ({}),
}))
/*
 * Stand-in for the uncontrolled Tapper-backed input. Like the real one it
 * reads `defaultValue` once, only changes through the imperative API, and
 * reports every change back through `onChange`.
 */
jest.mock('#/components/Composer', () => {
  const {useEffect, useImperativeHandle, useRef, useState} =
    jest.requireActual<typeof import('react')>('react')
  const {TextInput} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    useComposerInternalApiRef: () => useRef(null),
    Composer: ({
      internalApiRef,
      defaultValue,
      editable,
      onChange,
    }: {
      internalApiRef: React.Ref<unknown>
      defaultValue: string
      editable: boolean
      onChange: (text: string) => void
    }) => {
      const [value, setValue] = useState(defaultValue)
      const isFirstRender = useRef(true)
      useImperativeHandle(internalApiRef, () => ({
        clear: () => {
          mockClear()
          setValue('')
        },
        insert: (text: string) => {
          mockInsert(text)
          setValue(current => current + text)
        },
        setAutocompleteAnchor: () => {},
      }))
      useEffect(() => {
        if (isFirstRender.current) {
          isFirstRender.current = false
          return
        }
        onChange(value)
      }, [value, onChange])
      return (
        <TextInput
          testID="input"
          accessibilityLabel="input"
          accessibilityHint=""
          value={value}
          editable={editable}
          onChangeText={setValue}
        />
      )
    },
  }
})

function renderComposer(loading = false) {
  const element = (isLoading: boolean) => (
    <MessageComposer
      onSendMessage={mockOnSendMessage}
      messageEmbed={undefined}
      setEmbed={() => {}}
      loading={isLoading}
    />
  )
  const utils = render(element(loading))
  return {
    ...utils,
    rerenderComposer: (isLoading = loading) =>
      utils.rerender(element(isLoading)),
  }
}

const URL = 'https://example.com/thing'

beforeEach(() => {
  jest.clearAllMocks()
  mockParams = {conversation: 'c1'}
  mockDraft = ''
  mockNeedsEmailVerification = false
})

it('stages pending text once on mount and consumes the route param', () => {
  mockParams = {conversation: 'c1', text: URL}
  const {rerenderComposer} = renderComposer()

  expect(screen.getByTestId('input').props.value).toBe(URL)
  expect(mockSaveDraft).toHaveBeenLastCalledWith(URL)
  expect(mockSetParams).toHaveBeenCalledTimes(1)
  expect(mockSetParams).toHaveBeenCalledWith({text: undefined})

  /* A stale rerender, before the param update lands, must not insert again. */
  rerenderComposer()
  expect(mockInsert).toHaveBeenCalledTimes(1)
  expect(screen.getByTestId('input').props.value).toBe(URL)
})

it('appends pending text to an existing draft', () => {
  mockDraft = 'hello'
  mockParams = {conversation: 'c1', text: URL}
  renderComposer()

  expect(screen.getByTestId('input').props.value).toBe(`hello\n${URL}`)
  expect(mockSaveDraft).toHaveBeenLastCalledWith(`hello\n${URL}`)
})

it('stages text that arrives while already mounted, keeping typed text', () => {
  const {rerenderComposer} = renderComposer()
  expect(mockInsert).not.toHaveBeenCalled()

  fireEvent.changeText(screen.getByTestId('input'), 'typed')
  expect(mockSaveDraft).toHaveBeenLastCalledWith('typed')

  mockParams = {conversation: 'c1', text: URL}
  rerenderComposer()

  expect(mockInsert).toHaveBeenCalledTimes(1)
  expect(screen.getByTestId('input').props.value).toBe(`typed\n${URL}`)
  expect(mockSaveDraft).toHaveBeenLastCalledWith(`typed\n${URL}`)
  expect(mockSetParams).toHaveBeenCalledWith({text: undefined})

  /* Clearing the param afterwards doesn't touch the input again. */
  mockParams = {conversation: 'c1'}
  rerenderComposer()
  expect(mockInsert).toHaveBeenCalledTimes(1)
})

it('waits until the chat is editable before consuming pending text', () => {
  mockParams = {conversation: 'c1', text: URL}
  const {rerenderComposer} = renderComposer(true)

  expect(mockInsert).not.toHaveBeenCalled()
  expect(mockSetParams).not.toHaveBeenCalled()

  rerenderComposer(false)
  expect(screen.getByTestId('input').props.value).toBe(URL)
  expect(mockSetParams).toHaveBeenCalledTimes(1)
})

it('waits while email verification blocks editing', () => {
  mockNeedsEmailVerification = true
  mockParams = {conversation: 'c1', text: URL}
  renderComposer()

  expect(mockInsert).not.toHaveBeenCalled()
  expect(mockSetParams).not.toHaveBeenCalled()
})
