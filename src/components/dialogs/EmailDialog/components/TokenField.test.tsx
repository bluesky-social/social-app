import {fireEvent, render, screen} from '@testing-library/react-native'

import {isValidCode, TokenField} from './TokenField'

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
    expect(onChangeText).toHaveBeenCalledWith('ABCDE23456')
  })

  it('keeps formatted input stable', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'ABCDE-23456')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE-23456')
  })

  it('strips other characters while preserving digits and supplied hyphens', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'a!b8c-9d e')
    expect(onChangeText).toHaveBeenCalledWith('AB8C-9DE')
  })

  it('preserves 0 and 1 without mapping them to letters', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'e6kdf-jrk70')
    expect(onChangeText).toHaveBeenCalledWith('E6KDF-JRK70')
    fireEvent.changeText(getInput(), '1bcde')
    expect(onChangeText).toHaveBeenCalledWith('1BCDE')
  })

  it('keeps a hyphen typed after the first group', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'ABCDE-')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE-')
    fireEvent.changeText(getInput(), 'ABCDE-F')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE-F')
  })

  it('preserves a hyphen regardless of its position', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    fireEvent.changeText(getInput(), 'AB-')
    expect(onChangeText).toHaveBeenCalledWith('AB-')
  })

  it('preserves a TOTP code and leading zeros as it is typed', () => {
    const onChangeText = jest.fn()
    render(<TokenField testID={TEST_ID} onChangeText={onChangeText} />)
    for (const value of ['0', '01', '012', '0123', '01234', '012345']) {
      fireEvent.changeText(getInput(), value)
      expect(onChangeText).toHaveBeenLastCalledWith(value)
    }
  })

  it('does not restore a deleted hyphen', () => {
    const onChangeText = jest.fn()
    render(
      <TokenField
        testID={TEST_ID}
        value="ABCDE-23456"
        onChangeText={onChangeText}
      />,
    )
    fireEvent.changeText(getInput(), 'ABCDE23456')
    expect(onChangeText).toHaveBeenCalledWith('ABCDE23456')
  })

  it('does not impose an email code length or placeholder', () => {
    render(<TokenField testID={TEST_ID} />)
    expect(getInput().props.maxLength).toBeUndefined()
    expect(getInput().props.placeholder).toBeUndefined()
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

  it.each(['012345', '01234567', 'ABCDEFGHIJKL', 'ABCDE23456'])(
    'leaves validation of %s to the caller',
    value => {
      render(<TokenField testID={TEST_ID} value={value} />)
      expect(getInput().props['aria-invalid']).toBeUndefined()
    },
  )

  it('accepts alphanumeric codes with or without the email hyphen', () => {
    expect(isValidCode('ABCDE-23456')).toBe(true)
    expect(isValidCode('ABCDE23456')).toBe(true)
    expect(isValidCode('012345')).toBe(true)
  })

  it.each([
    '',
    'AB-CD',
    'ABCDE-2345',
    'ABCDE--23456',
    'ABCDEF-23456',
    'ABCDE-234567',
    'ABC!234',
  ])('rejects malformed code %s', value => {
    expect(isValidCode(value)).toBe(false)
  })

  it('does not flag an incomplete code', () => {
    render(<TokenField testID={TEST_ID} value="ABCDE-234" />)
    expect(getInput().props['aria-invalid']).toBeUndefined()
  })
})
