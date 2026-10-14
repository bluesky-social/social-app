import {fireEvent, render, screen} from '@testing-library/react-native'

import {TokenField} from './TokenField'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/components/icons/Shield', () => ({
  Shield_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/forms/TextField', () => {
  const {TextInput, View} =
    require('react-native') as typeof import('react-native')
  return {
    Root: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    Icon: () => null,
    Input: ({
      label,
      isInvalid,
      ...rest
    }: React.ComponentProps<typeof TextInput> & {
      label: string
      isInvalid?: boolean
    }) => (
      <TextInput
        {...rest}
        aria-label={label}
        aria-invalid={isInvalid ? true : undefined}
      />
    ),
  }
})

const TEST_ID = 'tokenField'

function getInput() {
  return screen.getByTestId(TEST_ID)
}

describe('TokenField', () => {
  it('normalizes lowercase, unhyphenated input', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'abcde23456')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE-23456')
  })

  it('keeps formatted input stable', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'ABCDE-23456')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE-23456')
  })

  it('strips characters outside the base32 alphabet', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'a1b0c8d-9e')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE')
  })

  it('defaults autocomplete to off', () => {
    render(<TokenField testID={TEST_ID} />)
    expect(getInput().props.autoComplete).toBe('off')
  })

  it('forwards sign-in props to the input', () => {
    render(
      <TokenField
        testID={TEST_ID}
        autoFocus
        autoComplete="one-time-code"
        returnKeyType="done"
        blurOnSubmit={false}
        accessibilityHint="Input the code"
        editable={false}
      />,
    )
    const props = getInput().props
    expect(props.autoFocus).toBe(true)
    expect(props.autoComplete).toBe('one-time-code')
    expect(props.returnKeyType).toBe('done')
    expect(props.blurOnSubmit).toBe(false)
    expect(props.accessibilityHint).toBe('Input the code')
    expect(props.editable).toBe(false)
  })

  it('calls onSubmitEditing', () => {
    const onSubmitEditing = jest.fn()
    render(
      <TokenField
        testID={TEST_ID}
        value="ABCDE-23456"
        onSubmitEditing={onSubmitEditing}
      />,
    )
    fireEvent(getInput(), 'submitEditing')
    expect(onSubmitEditing).toHaveBeenCalledTimes(1)
  })

  it('respects caller isInvalid for a valid code', () => {
    render(<TokenField testID={TEST_ID} value="ABCDE-23456" isInvalid />)
    expect(getInput().props['aria-invalid']).toBe(true)
  })

  it('is not invalid for a valid code by default', () => {
    render(<TokenField testID={TEST_ID} value="ABCDE-23456" />)
    expect(getInput().props['aria-invalid']).toBeUndefined()
  })

  it('flags a malformed full-length code independently', () => {
    render(<TokenField testID={TEST_ID} value="ABCDE-2345!" />)
    expect(getInput().props['aria-invalid']).toBe(true)
  })

  it('does not flag an incomplete code', () => {
    render(<TokenField testID={TEST_ID} value="ABCDE-234" />)
    expect(getInput().props['aria-invalid']).toBeUndefined()
  })
})
