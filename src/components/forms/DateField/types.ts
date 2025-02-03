export type DateFieldProps = {
  value: string | Date
  onChangeDate: (date: string) => void
  label: string
  isInvalid?: boolean
  testID?: string
  accessibilityHint?: string
  maximumDate?: string | Date
}
