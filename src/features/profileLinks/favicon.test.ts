import {describe, expect, it} from '@jest/globals'

import {linkFaviconUrl} from './favicon'

describe('linkFaviconUrl', () => {
  const link = {
    url: 'https://a.example',
    iconUrl: 'https://cdn.example/light.png',
    iconDarkUrl: 'https://cdn.example/dark.png',
  }

  it('uses the dark icon in a dark color scheme', () => {
    expect(linkFaviconUrl(link, undefined, true)).toBe(
      'https://cdn.example/dark.png',
    )
    expect(linkFaviconUrl(link, undefined)).toBe(
      'https://cdn.example/light.png',
    )
  })

  it('falls back to the icon when there is no dark one', () => {
    const {iconDarkUrl: _dark, ...lightOnly} = link
    expect(linkFaviconUrl(lightOnly, undefined, true)).toBe(
      'https://cdn.example/light.png',
    )
  })
})
