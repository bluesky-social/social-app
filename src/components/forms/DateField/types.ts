export type DateFieldRef = {
  focus: () => void
  blur: () => void
}
export type DateFieldProps = {
  /**
   * An empty string renders the placeholder and opens the picker at today (or
   * maximumDate, if earlier).
   */
  value: string | Date
  onChangeDate: (date: string) => void
  /**
   * Fired when the user commits a date: iOS "Done", Android confirm, or web
   * input change. Distinct from onChangeDate, which on iOS fires on every
   * scroll tick.
   */
  onConfirm?: (date: string) => void
  /**
   * Shown on native when value is empty. Web uses the browser's native date
   * placeholder.
   */
  placeholder?: string
  label: string
  inputRef?: React.Ref<DateFieldRef>
  isInvalid?: boolean
  testID?: string
  accessibilityHint?: string
  maximumDate?: string | Date
  minimumDate?: string | Date
}
