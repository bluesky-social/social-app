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

    expect(DEFAULT_BRAND_CONFIG.theme.brand).toEqual({
      black: '#070C0C',
      white: '#F8FAF9',
      twilight: '#161E27',
      gray300: '#C8CAC9',
      gray400: '#9C9E9E',
      gray600: '#6A6A6A',
      primaryLight: '#6060E9',
      primaryLightTint: '#EAEBFC',
      primaryDark: '#8686FF',
      primaryDarkTint: '#464985',
      secondary: '#D2FC51',
      secondaryTint: '#F1FECB',
      negative: '#F40B42',
    })
    expect(DEFAULT_BRAND_CONFIG.theme.colorScale).toEqual({
      primary_25: '#EAEBFC',
      primary_50: '#DCDDFA',
      primary_100: '#C6C8F5',
      primary_200: '#B0B3F0',
      primary_300: '#989CED',
      primary_400: '#8286E7',
      primary_500: '#6060E9',
      primary_600: '#5252C3',
      primary_700: '#4545A8',
      primary_800: '#38388D',
      primary_900: '#2B2B71',
      primary_950: '#1E1E56',
      primary_975: '#13133B',
    })
    expect(DEFAULT_BRAND_CONFIG.theme.css.selectionLight).toBe('#D2FC51')
    expect(DEFAULT_BRAND_CONFIG.theme.css.selectionDark).toBe('#464985')
  })
})
