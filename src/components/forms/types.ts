import {AccessibilityProps} from 'react-native'

export type RequiredAccessibilityProps = Required<AccessibilityProps>

export type BaseProps<T = string> = AccessibilityProps & {
  value: T
  onChange: (value: T) => void
  testID?: string
  label: string
  hasError?: boolean
}
