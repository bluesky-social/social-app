import {shouldShowAutocomplete} from '#/components/Autocomplete/util'

function emoji(raw: string, value = raw.slice(1)) {
  return {type: 'emoji', raw, value}
}

describe('shouldShowAutocomplete', () => {
  it.each(['', ')', '(', 'D', 'P', 'p', '3', 'a'])(
    'stays closed for one character: %j',
    value => {
      expect(shouldShowAutocomplete(emoji(':' + value))).toBe(false)
    },
  )

  it.each(['-)', '-(', '-P', '-D', '+D', "'(", 'o)', '/', '//', ')?'])(
    'stays closed for emoticons: %j',
    value => {
      expect(shouldShowAutocomplete(emoji(':' + value))).toBe(false)
    },
  )

  it.each(['sm', 'smile', 'thumbs_up', 't-rex', '100', 'DD'])(
    'opens for a shortcode prefix: %j',
    value => {
      expect(shouldShowAutocomplete(emoji(':' + value))).toBe(true)
    },
  )

  it.each(['+', '-', '+1', '-1'])(
    'opens for a thumbs up or down prefix: %j',
    value => {
      expect(shouldShowAutocomplete(emoji(':' + value))).toBe(true)
    },
  )

  it('opens for a complete shortcode so it can be converted', () => {
    // a regex-matched facet: value excludes the colons
    expect(shouldShowAutocomplete(emoji(':a:', 'a'))).toBe(true)
    // a trigger node: value runs to the cursor, closing colon included
    expect(shouldShowAutocomplete(emoji(':+1:'))).toBe(true)
  })

  it('stays closed for a colon-wrapped emoticon', () => {
    expect(shouldShowAutocomplete(emoji(':):'))).toBe(false)
  })

  it('never opens for urls, always opens for mentions', () => {
    const url = {type: 'url', raw: 'bsky.app', value: 'bsky.app'}
    expect(shouldShowAutocomplete(url)).toBe(false)
    const mention = {type: 'mention', raw: '@', value: ''}
    expect(shouldShowAutocomplete(mention)).toBe(true)
  })
})
