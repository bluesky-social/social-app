import {type AutocompleteItem} from '#/components/Autocomplete'

export type AutocompleteInputProps = {
  label: string
  value: string
  placeholder?: string
  onChangeText: (text: string) => void
  onSubmitEditing?: () => void
}

// The typeahead matches the last space-delimited token, so earlier completed
// values are left alone while the user types the next one.
export function lastTokenOf(value: string): string {
  return value.split(/\s+/u).pop() ?? ''
}

// Replaces the in-progress last token with the chosen handle, keeping earlier
// values, and leaves a trailing space to start the next one. The trailing space
// empties the last token, which dismisses the list.
export function appendSelection(
  value: string,
  lastToken: string,
  item: AutocompleteItem,
): string | null {
  if (item.type !== 'profile') return null
  const prefix = value.slice(0, value.length - lastToken.length)
  return `${prefix}${item.profile.handle} `
}
