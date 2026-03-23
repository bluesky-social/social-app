import {describe, expect, it} from '@jest/globals'

import {parseLinkingUrl} from '../parseLinkingUrl'

describe('parseLinkingUrl', () => {
  it('should correctly parse bluesky:// URLs', () => {
    const url =
      'bluesky://intent/age-assurance?result=success&actorDid=did:example:123'
    const urlp = parseLinkingUrl(url)
    expect(urlp.protocol).toBe('bluesky:')
    expect(urlp.host).toBe('')
    expect(urlp.pathname).toBe('/intent/age-assurance')
  })

  it('should correctly parse standard URLs', () => {
    const url =
      'https://bsky.app/intent/age-assurance?result=success&actorDid=did:example:123'
    const urlp = parseLinkingUrl(url)
    expect(urlp.protocol).toBe('https:')
    expect(urlp.host).toBe('bsky.app')
    expect(urlp.pathname).toBe('/intent/age-assurance')
  })
})
