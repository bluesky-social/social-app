export type TimeFieldRef = {
  focus: () => void
  blur: () => void
}
export type TimeFieldProps = {
  ref?: React.Ref<TimeFieldRef>
  value: string | Date
  onChangeDate: (date: string) => void
  label: string
  isInvalid?: boolean
  testID?: string
  accessibilityHint?: string
  maximumDate?: string | Date
  minimumDate?: string | Date
  minuteInterval?: 1 | 2 | 3 | 4 | 6 | 15 | 30 | 5 | 12 | 10 | 20
}
