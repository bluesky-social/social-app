import {fireEvent, render} from '@testing-library/react-native'

import * as Menu from '#/components/Menu'
import {RepostButtonMenu} from './RepostButtonMenu'

jest.mock('#/state/session', () => ({
  useRequireAuth: () => (callback: () => void) => callback(),
  useSession: () => ({hasSession: true}),
}))
jest.mock('#/alf', () => ({
  useTheme: () => ({palette: {positive_500: 'green'}}),
}))
jest.mock('#/components/Menu', () => {
  const {Pressable, Text, View} = require('react-native')
  const open = jest.fn()
  const unanchoredOpen = jest.fn()

  return {
    __testOpen: open,
    __testUnanchoredOpen: unanchoredOpen,
    Root: ({children}: React.PropsWithChildren) => <View>{children}</View>,
    Trigger: ({
      children,
      label,
    }: {
      children: (args: {
        control: {open: () => void}
        props: {accessibilityLabel: string; onPress: () => void}
      }) => React.ReactNode
      label: string
    }) =>
      children({
        control: {open: unanchoredOpen},
        props: {accessibilityLabel: label, onPress: open},
      }),
    Outer: ({children}: React.PropsWithChildren) => <View>{children}</View>,
    Item: ({
      children,
      disabled,
      label,
      onPress,
      testID,
    }: React.PropsWithChildren<{
      disabled?: boolean
      label: string
      onPress: () => void
      testID: string
    }>) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityState={{disabled}}
        disabled={disabled}
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ItemText: ({children}: React.PropsWithChildren) => <Text>{children}</Text>,
    ItemIcon: () => null,
  }
})
jest.mock('#/components/PostControls/util', () => ({
  useFormatPostStatCount: () => String,
}))
jest.mock('./PostControlButton', () => {
  const {Pressable, Text} = require('react-native')

  return {
    PostControlButton: ({
      children,
      label,
      onLongPress,
      onPress,
      testID,
    }: React.PropsWithChildren<{
      label?: string
      onLongPress?: () => void
      onPress?: () => void
      testID?: string
    }>) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        onLongPress={onLongPress}
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    PostControlButtonIcon: () => null,
    PostControlButtonText: ({
      children,
      testID,
    }: React.PropsWithChildren<{
      testID?: string
    }>) => <Text testID={testID}>{children}</Text>,
  }
})
jest.mock('#/view/com/util/EventStopper', () => ({
  EventStopper: ({children}: React.PropsWithChildren) => children,
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : message.message,
  }),
}))

const mockMenuOpen = (Menu as unknown as {__testOpen: jest.Mock}).__testOpen
const mockUnanchoredOpen = (
  Menu as unknown as {__testUnanchoredOpen: jest.Mock}
).__testUnanchoredOpen

afterEach(() => {
  jest.clearAllMocks()
})

describe('RepostButtonMenu', () => {
  it('keeps Undo repost available and disables quote when embedding is disabled', () => {
    const onRepost = jest.fn()
    const onQuote = jest.fn()
    const screen = render(
      <RepostButtonMenu
        isReposted
        onRepost={onRepost}
        onQuote={onQuote}
        embeddingDisabled
      />,
    )

    const undoButton = screen.getByTestId('repostDropdownRepostBtn')
    const quoteButton = screen.getByTestId('repostDropdownQuoteBtn')

    expect(undoButton.props.accessibilityLabel).toBe('Undo repost')
    fireEvent.press(undoButton)
    expect(onRepost).toHaveBeenCalledTimes(1)

    expect(quoteButton.props.accessibilityLabel).toBe('Quote posts disabled')
    fireEvent.press(quoteButton)
    expect(onQuote).not.toHaveBeenCalled()
  })

  it('opens the menu on long press when quote is disabled', () => {
    const screen = render(
      <RepostButtonMenu
        isReposted={false}
        onRepost={jest.fn()}
        onQuote={jest.fn()}
        embeddingDisabled
        longPressToQuote
      />,
    )

    fireEvent(screen.getByTestId('repostBtn'), 'longPress')

    expect(mockMenuOpen).toHaveBeenCalledTimes(1)
    expect(mockUnanchoredOpen).not.toHaveBeenCalled()
  })

  it('keeps long press-to-quote when quote is enabled', () => {
    const onQuote = jest.fn()
    const screen = render(
      <RepostButtonMenu
        isReposted={false}
        onRepost={jest.fn()}
        onQuote={onQuote}
        embeddingDisabled={false}
        longPressToQuote
      />,
    )

    fireEvent(screen.getByTestId('repostBtn'), 'longPress')

    expect(onQuote).toHaveBeenCalledTimes(1)
    expect(mockMenuOpen).not.toHaveBeenCalled()
  })
})
