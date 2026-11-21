export function parseAutocompleteItemType(type: string) {
  switch (type) {
    case 'mention':
      return 'profile'
    case 'tag':
      return 'tag'
    case 'emoji':
      return 'emoji'
    default:
      throw new Error(`Unknown autocomplete item type: ${type}`)
  }
}
