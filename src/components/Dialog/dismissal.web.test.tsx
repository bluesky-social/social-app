import {act, createRef} from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {Close, Inner, Outer} from '#/components/Dialog/index.web'
import {type DialogControlProps} from '#/components/Dialog/types'

let mockOnDismiss: (() => void) | undefined

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/state/dialogs', () => ({
  useDialogStateControlContext: () => ({setDialogIsOpen: jest.fn()}),
}))
jest.mock('#/state/a11y', () => ({
  useA11y: () => ({reduceMotionEnabled: true}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  flatten: (style: unknown) => style,
  web: () => ({}),
  useBreakpoints: () => ({gtMobile: true}),
  useTheme: () => ({
    atoms: {bg: {}},
    palette: {contrast_200: '#000', black: '#000'},
    name: 'light',
  }),
}))
jest.mock('#/logger', () => ({logger: {error: jest.fn()}}))
jest.mock('#/components/Portal', () => ({
  Portal: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))
jest.mock('react-remove-scroll-bar', () => ({RemoveScrollBar: () => null}))
jest.mock('@radix-ui/react-focus-guards', () => ({useFocusGuards: () => {}}))
jest.mock('@radix-ui/react-focus-scope', () => ({
  FocusScope: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))
jest.mock('@radix-ui/react-dismissable-layer', () => ({
  DismissableLayer: ({
    children,
    onDismiss,
  }: {
    children: React.ReactNode
    onDismiss: () => void
  }) => {
    mockOnDismiss = onDismiss
    return <>{children}</>
  },
}))
jest.mock('#/components/icons/Times', () => ({
  TimesLarge_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} = require('react-native') as typeof import('react-native')
  return {
    Button: ({
      onPress,
      disabled,
      children,
    }: {
      onPress?: () => void
      disabled?: boolean
      children?: React.ReactNode
    }) => (
      <Pressable
        accessibilityRole="button"
        testID="dialogClose"
        onPress={onPress}
        disabled={disabled}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
  }
})

function makeControl() {
  const ref = createRef<DialogControlProps['ref']['current']>()
  const control = {
    id: 'test',
    ref,
    open: () => ref.current?.open(),
    close: (cb?: () => void) => ref.current?.close(cb),
  } as unknown as DialogControlProps
  return control
}

function renderDialog({
  preventDismiss,
  onBackgroundPress,
}: {
  preventDismiss?: boolean
  onBackgroundPress?: () => void
}) {
  const control = makeControl()
  const ui = (prevent?: boolean) => (
    <Outer
      control={control}
      preventDismiss={prevent}
      webOptions={{onBackgroundPress}}>
      <Inner label="Test dialog">
        <Close />
      </Inner>
    </Outer>
  )
  const utils = render(ui(preventDismiss))
  act(() => control.open())
  return {control, rerender: (prevent?: boolean) => utils.rerender(ui(prevent))}
}

const isOpen = () => screen.queryByLabelText('Test dialog') !== null
const isCloseDisabled = () => {
  const state = screen.getByTestId('dialogClose').props.accessibilityState as
    {disabled?: boolean} | undefined
  return !!state?.disabled
}

describe('Dialog preventDismiss (web)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockOnDismiss = undefined
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('blocks backdrop, Escape/outside dismissal and the close button while locked', () => {
    const onBackgroundPress = jest.fn()
    renderDialog({preventDismiss: true, onBackgroundPress})
    expect(isOpen()).toBe(true)

    fireEvent.press(screen.getByLabelText('Close active dialog'))
    act(() => mockOnDismiss?.())
    fireEvent.press(screen.getByTestId('dialogClose'))

    expect(onBackgroundPress).not.toHaveBeenCalled()
    expect(isCloseDisabled()).toBe(true)
    expect(isOpen()).toBe(true)
  })

  it('still closes programmatically, running the callback, while locked', () => {
    const {control} = renderDialog({preventDismiss: true})
    const callback = jest.fn()

    act(() => control.close(callback))
    expect(isOpen()).toBe(false)
    act(() => {
      jest.runAllTimers()
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('unlocks when preventDismiss goes back to false', () => {
    const {rerender} = renderDialog({preventDismiss: true})
    expect(isCloseDisabled()).toBe(true)
    rerender(false)
    expect(isCloseDisabled()).toBe(false)
    act(() => mockOnDismiss?.())
    expect(isOpen()).toBe(false)
  })
})
