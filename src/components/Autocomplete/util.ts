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

/*
 * `:` is both the emoji trigger and the eyes of most emoticons, and the emoji
 * search is fuzzy, so `:)` alone would open the menu with `:a:` selected.
 * Like Slack, wait for two shortcode characters, starting with a letter or
 * digit. A complete `:shortcode:` always counts, so the composer can still
 * convert short ones like `:a:` when the closing colon is typed.
 */
const EMOJI_QUERY = /^[a-z0-9][a-z0-9_+-]+$/i
const EMOJI_SHORTCODE = /^:[a-z0-9_+-]+:$/i

export function shouldShowAutocomplete(facet: {
  type: string
  raw: string
  value: string
}) {
  switch (facet.type) {
    case 'url':
      return false
    case 'emoji':
      return EMOJI_SHORTCODE.test(facet.raw) || EMOJI_QUERY.test(facet.value)
    default:
      return true
  }
}
