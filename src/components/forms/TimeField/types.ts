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
}
