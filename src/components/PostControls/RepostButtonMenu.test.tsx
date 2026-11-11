import {fireEvent, render, within} from '@testing-library/react-native'

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

  return {
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
        control: {open: jest.fn()},
        props: {accessibilityLabel: label, onPress: jest.fn()},
      }),
    Outer: ({children}: React.PropsWithChildren) => <View>{children}</View>,
    Group: ({children}: React.PropsWithChildren) => (
      <View testID="menuGroup">{children}</View>
    ),
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
      onPress,
      testID,
    }: React.PropsWithChildren<{
      label?: string
      onPress?: () => void
      testID?: string
    }>) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
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

afterEach(() => {
  jest.clearAllMocks()
})

describe('RepostButtonMenu', () => {
  it('keeps repost and quote together in one group', () => {
    const screen = render(
      <RepostButtonMenu
        isReposted={false}
        onRepost={jest.fn()}
        onQuote={jest.fn()}
        embeddingDisabled={false}
      />,
    )
    const group = within(screen.getByTestId('menuGroup'))

    expect(group.getByTestId('repostDropdownRepostBtn')).toBeTruthy()
    expect(group.getByTestId('repostDropdownQuoteBtn')).toBeTruthy()
  })

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
})
