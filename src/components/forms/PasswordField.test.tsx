import {createRef, useState} from 'react'
import {
  type StyleProp,
  StyleSheet,
  type TextInput,
  View,
  type ViewStyle,
} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {PasswordField} from './PasswordField'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/env', () => ({IS_WEB: false, IS_NATIVE: true}))
jest.mock('#/alf', () => {
  const theme = {
    name: 'light',
    palette: {contrast_500: '#888', negative_25: '#fee', negative_300: '#f99'},
    atoms: new Proxy({}, {get: () => ({})}),
  }
  return {
    atoms: new Proxy({}, {get: () => ({})}),
    tokens: {space: {xs: 4, sm: 8}},
    useTheme: () => theme,
    useAlf: () => ({fonts: {family: 'system', scaleMultiplier: 1}}),
    flatten: (style: unknown) =>
      Object.assign({}, ...[style].flat(Infinity).filter(Boolean)),
    applyFonts: () => {},
    platform: () => undefined,
    web: () => undefined,
  }
})
jest.mock('#/components/Button', () => {
  const {Pressable} = require('react-native') as typeof import('react-native')
  return {
    Button: ({
      testID,
      label,
      onPress,
      children,
    }: {
      testID?: string
      label: string
      onPress?: () => void
      children: React.ReactNode
    }) => (
      <Pressable
        accessibilityRole="button"
        aria-label={label}
        testID={testID}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native') as typeof import('react-native')
  return {Text}
})
jest.mock('#/components/icons/Lock', () => ({
  Lock_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Eye', () => ({
  Eye_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/EyeSlash', () => ({
  EyeSlash_Stroke2_Corner0_Rounded: () => null,
}))

const INPUT_ID = 'passwordField'
const TOGGLE_ID = 'showPasswordButton'

function Harness({
  initialValue = '',
  onChangeText,
  ...rest
}: {
  initialValue?: string
  onChangeText?: (value: string) => void
} & Partial<React.ComponentProps<typeof PasswordField>>) {
  const [value, setValue] = useState(initialValue)
  return (
    <PasswordField
      testID={INPUT_ID}
      label="Password"
      {...rest}
      value={value}
      onChangeText={v => {
        setValue(v)
        onChangeText?.(v)
      }}
    />
  )
}

function getInput() {
  return screen.getByTestId(INPUT_ID)
}

describe('PasswordField', () => {
  it('masks the password by default', () => {
    render(<Harness initialValue="hunter2" />)
    expect(getInput().props.secureTextEntry).toBe(true)
  })

  it('reveals and hides the password with translated labels', () => {
    render(<Harness initialValue="hunter2" />)
    expect(screen.getByLabelText('Reveal password')).toBeTruthy()

    fireEvent.press(screen.getByTestId(TOGGLE_ID))
    expect(getInput().props.secureTextEntry).toBe(false)
    expect(screen.getByLabelText('Hide password')).toBeTruthy()
    expect(screen.queryByLabelText('Reveal password')).toBeNull()

    fireEvent.press(screen.getByTestId(TOGGLE_ID))
    expect(getInput().props.secureTextEntry).toBe(true)
    expect(screen.getByLabelText('Reveal password')).toBeTruthy()
  })

  it('hides the toggle when empty and unfocused', () => {
    render(<Harness />)
    expect(screen.queryByTestId(TOGGLE_ID)).toBeNull()
  })

  it('shows the toggle when focused while empty', () => {
    render(<Harness />)
    fireEvent(getInput(), 'focus')
    expect(screen.getByTestId(TOGGLE_ID)).toBeTruthy()
    fireEvent(getInput(), 'blur')
    expect(screen.queryByTestId(TOGGLE_ID)).toBeNull()
  })

  it('shows the toggle when nonempty and unfocused', () => {
    render(<Harness initialValue="a" />)
    expect(screen.getByTestId(TOGGLE_ID)).toBeTruthy()
  })

  it('passes typed text to onChangeText unmodified', () => {
    const onChangeText = jest.fn()
    render(<Harness onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), ' Hunter 2 ')
    expect(onChangeText).toHaveBeenCalledWith(' Hunter 2 ')
    expect(getInput().props.value).toBe(' Hunter 2 ')
  })

  it('preserves the value across toggles', () => {
    render(<Harness initialValue=" MiXed Case " />)
    fireEvent.press(screen.getByTestId(TOGGLE_ID))
    expect(getInput().props.value).toBe(' MiXed Case ')
    fireEvent.press(screen.getByTestId(TOGGLE_ID))
    expect(getInput().props.value).toBe(' MiXed Case ')
  })

  it('keeps the same input mounted when toggling', () => {
    render(<Harness initialValue="hunter2" />)
    const before = getInput()
    fireEvent.press(screen.getByTestId(TOGGLE_ID))
    expect(getInput()).toBe(before)
  })

  it('applies defaults', () => {
    render(<Harness />)
    expect(getInput().props.autoCapitalize).toBe('none')
    expect(getInput().props.autoCorrect).toBe(false)
    expect(getInput().props.hitSlop).toMatchObject({right: 0})
  })

  it('forwards caller props to the input', () => {
    const onLayout = jest.fn()
    const onSubmitEditing = jest.fn()
    const onFocus = jest.fn()
    const onBlur = jest.fn()
    render(
      <Harness
        autoComplete="new-password"
        passwordRules="minlength: 8;"
        placeholder="At least 8 characters"
        submitBehavior="blurAndSubmit"
        returnKeyType="next"
        autoCapitalize="words"
        autoCorrect
        accessibilityHint="Enter your password"
        onLayout={onLayout}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    )
    const input = getInput()
    expect(input.props.autoComplete).toBe('new-password')
    expect(input.props.passwordRules).toBe('minlength: 8;')
    expect(input.props.placeholder).toBe('At least 8 characters')
    expect(input.props.submitBehavior).toBe('blurAndSubmit')
    expect(input.props.returnKeyType).toBe('next')
    expect(input.props.autoCapitalize).toBe('words')
    expect(input.props.autoCorrect).toBe(true)
    expect(input.props.accessibilityLabel).toBe('Password')

    fireEvent(input, 'layout', {nativeEvent: {layout: {}}})
    fireEvent(input, 'submitEditing')
    fireEvent(input, 'focus')
    fireEvent(input, 'blur')
    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(onSubmitEditing).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('forwards autoComplete variants', () => {
    for (const autoComplete of ['current-password', 'new-password', 'off']) {
      const {unmount} = render(<Harness autoComplete={autoComplete as 'off'} />)
      expect(getInput().props.autoComplete).toBe(autoComplete)
      unmount()
    }
  })

  it('forwards a null placeholder', () => {
    render(<Harness placeholder={null} />)
    // `null` suppresses the label fallback (undefined on iOS in this mock)
    expect(getInput().props.placeholder).toBeUndefined()
  })

  it('forwards editable', () => {
    render(<Harness editable={false} />)
    expect(getInput().props.editable).toBe(false)
  })

  it('applies the invalid chrome only when isInvalid', () => {
    const hasErrorChrome = () =>
      screen
        .UNSAFE_getAllByType(View)
        .some(
          v =>
            (StyleSheet.flatten(v.props.style as StyleProp<ViewStyle>) ?? {})
              .borderColor === '#f99',
        )

    const {rerender} = render(<Harness />)
    expect(hasErrorChrome()).toBe(false)
    rerender(<Harness isInvalid />)
    expect(hasErrorChrome()).toBe(true)
  })

  it('forwards inputRef to the input', () => {
    const ref = createRef<React.ComponentRef<typeof TextInput>>()
    render(<Harness inputRef={ref} />)
    expect(ref.current).toBeTruthy()
  })

  it('does not forward secureTextEntry overrides', () => {
    render(
      <Harness
        {...({secureTextEntry: false} as Partial<
          React.ComponentProps<typeof PasswordField>
        >)}
      />,
    )
    expect(getInput().props.secureTextEntry).toBe(true)
  })
})
