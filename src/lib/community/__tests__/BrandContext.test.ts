import {describe, expect, it} from '@jest/globals'

import {DISCOVER_FEED_URI, VIDEO_FEED_URI} from '#/lib/constants'
import {BRAND_DOMAIN, DEFAULT_BRAND_CONFIG} from '../BrandContext'

describe('BrandContext defaults', () => {
  it('preserves Blacksky defaults when no brand config is injected', () => {
    expect(DEFAULT_BRAND_CONFIG.metadata.name).toBe('Blacksky')
    expect(DEFAULT_BRAND_CONFIG.metadata.displayName).toBe('Blacksky')
    expect(DEFAULT_BRAND_CONFIG.metadata.slug).toBe('blacksky')
    expect(DEFAULT_BRAND_CONFIG.metadata.communityDid).toBe(
      'did:plc:w4es6sfejnpqztrwcbot6gxt',
    )

    expect(DEFAULT_BRAND_CONFIG.messages.composerPlaceholder).toBe(
      "What's poppin'?",
    )
    expect(DEFAULT_BRAND_CONFIG.messages.primaryCTA).toBe('Join the cookout')
    expect(DEFAULT_BRAND_CONFIG.messages.welcomeMessage).toBe(
      'Welcome to the cookout!',
    )
    expect(DEFAULT_BRAND_CONFIG.messages.postButtonLabel).toBe('Post')

    expect(DEFAULT_BRAND_CONFIG.services.pds.url).toBe('https://blacksky.app')
    expect(DEFAULT_BRAND_CONFIG.web.domains.main).toBe(
      'https://blacksky.community',
    )
    expect(DEFAULT_BRAND_CONFIG.web.domains.shortlink).toBe(
      'https://go.blacksky.community',
    )
    expect(BRAND_DOMAIN).toBe('blacksky.community')

    expect(DEFAULT_BRAND_CONFIG.feeds.defaultPinned).toEqual([
      {type: 'feed', value: DISCOVER_FEED_URI, pinned: true},
      {type: 'timeline', value: 'following', pinned: true},
      {type: 'feed', value: VIDEO_FEED_URI, pinned: true},
    ])
  })
})
