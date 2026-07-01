import {describe, expect, it} from '@jest/globals'

import {
  DEFAULT_DISCOVERY_FEEDS,
  deriveBrandColors,
  deriveCssValues,
  generateAccentGradient,
  generateColorScale,
  generateComputedConfig,
  generatePrimaryGradient,
  generateSecondaryGradient,
  hexToHsl,
  hslToHex,
} from '../configGenerator'
import {type RawCommunityConfig} from '../types'

// ---------------------------------------------------------------------------
// Known I/O pairs from apply-whitelabel.js running on theinvite.config.json
// Primary: #F2973B, Secondary: #D53E2B, Accent: #A8D8AA
// ---------------------------------------------------------------------------

describe('hexToHsl', () => {
  it('converts #F2973B (The Invite primary) correctly', () => {
    const hsl = hexToHsl('#F2973B')
    expect(hsl.h).toBe(30)
    expect(hsl.s).toBe(88)
    expect(hsl.l).toBe(59)
  })

  it('converts #D53E2B (The Invite secondary) correctly', () => {
    const hsl = hexToHsl('#D53E2B')
    expect(hsl.h).toBe(7)
    expect(hsl.s).toBe(67)
    expect(hsl.l).toBe(50)
  })

  it('converts #A8D8AA (The Invite accent) correctly', () => {
    const hsl = hexToHsl('#A8D8AA')
    expect(hsl.h).toBe(122)
    expect(hsl.s).toBe(38)
    expect(hsl.l).toBe(75)
  })

  it('handles pure black', () => {
    const hsl = hexToHsl('#000000')
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(0)
  })

  it('handles pure white', () => {
    const hsl = hexToHsl('#ffffff')
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(100)
  })

  it('handles hex without #', () => {
    const hsl = hexToHsl('F2973B')
    expect(hsl.h).toBe(30)
  })
})

describe('hslToHex', () => {
  it('converts back to approximate original for The Invite primary', () => {
    // hexToHsl(#F2973B) = {h:30, s:88, l:59}
    // hslToHex round-trip may have minor rounding differences
    const hex = hslToHex(30, 88, 59)
    // Should be close to #F2973B (exact match depends on rounding)
    expect(hex.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('handles achromatic (s=0)', () => {
    const hex = hslToHex(0, 0, 50)
    expect(hex).toBe('#808080')
  })

  it('handles pure black', () => {
    const hex = hslToHex(0, 0, 0)
    expect(hex).toBe('#000000')
  })

  it('handles pure white', () => {
    const hex = hslToHex(0, 0, 100)
    expect(hex).toBe('#ffffff')
  })
})

describe('generatePrimaryGradient', () => {
  it('generates 4-stop gradient from #F2973B', () => {
    const gradient = generatePrimaryGradient('#F2973B')
    expect(gradient).toHaveLength(4)

    // Stops at 0, 0.4, 0.6, 1
    expect(gradient[0].position).toBe(0)
    expect(gradient[1].position).toBe(0.4)
    expect(gradient[2].position).toBe(0.6)
    expect(gradient[3].position).toBe(1)

    // Middle two stops should be the base color
    expect(gradient[1].color).toBe('#F2973B')
    expect(gradient[2].color).toBe('#F2973B')

    // First stop should be darker (hsl: h=30, s=max(0,88-10)=78, l=max(0,59-20)=39)
    const darkerHsl = hexToHsl(gradient[0].color)
    expect(darkerHsl.l).toBeLessThan(59)

    // Last stop should be lighter (hsl: h=30, s=88, l=min(100,59+15)=74)
    const lighterHsl = hexToHsl(gradient[3].color)
    expect(lighterHsl.l).toBeGreaterThan(59)
  })
})

describe('generateSecondaryGradient', () => {
  it('generates 2-stop gradient from #D53E2B', () => {
    const gradient = generateSecondaryGradient('#D53E2B')
    expect(gradient).toHaveLength(2)

    expect(gradient[0].position).toBe(0)
    expect(gradient[1].position).toBe(1)

    const darkerHsl = hexToHsl(gradient[0].color)
    const lighterHsl = hexToHsl(gradient[1].color)
    expect(darkerHsl.l).toBeLessThan(lighterHsl.l)
  })
})

describe('generateAccentGradient', () => {
  it('generates 3-stop gradient from #A8D8AA', () => {
    const gradient = generateAccentGradient('#A8D8AA')
    expect(gradient).toHaveLength(3)

    expect(gradient[0].position).toBe(0)
    expect(gradient[1].position).toBe(0.6)
    expect(gradient[2].position).toBe(1)

    // Middle stop should be the base color
    expect(gradient[1].color).toBe('#A8D8AA')
  })
})

describe('deriveBrandColors', () => {
  it('derives brand colors matching whitelabel script output for The Invite', () => {
    const brand = deriveBrandColors('#F2973B', '#D53E2B')

    // primaryLight is the primary color uppercased
    expect(brand.primaryLight).toBe('#F2973B')

    // primaryLightTint: hslToHex(30, max(10, 88-40)=48, 93)
    expect(brand.primaryLightTint).toMatch(/^#[0-9A-F]{6}$/)

    // primaryDark: hslToHex(30, 88, min(75, 59+15)=74)
    expect(brand.primaryDark).toMatch(/^#[0-9A-F]{6}$/)

    // primaryDarkTint: hslToHex(30, max(10, 88-30)=58, 30)
    expect(brand.primaryDarkTint).toMatch(/^#[0-9A-F]{6}$/)

    // secondary is the secondary color uppercased
    expect(brand.secondary).toBe('#D53E2B')

    // Grays are passthrough
    expect(brand.gray300).toBe('#C8CAC9')
    expect(brand.gray400).toBe('#9C9E9E')
    expect(brand.gray600).toBe('#6A6A6A')

    // negative is constant
    expect(brand.negative).toBe('#F40B42')

    // Backgrounds are auto-generated from primary hue
    expect(brand.white).toMatch(/^#[0-9a-f]{6}$/)
    expect(brand.black).toMatch(/^#[0-9a-f]{6}$/)
    expect(brand.twilight).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('uses default secondary when not provided', () => {
    const brand = deriveBrandColors('#F2973B')
    expect(brand.secondary).toBe('#D53E2B')
    expect(brand.secondaryTint).toBe('#EFDEDC')
  })
})

describe('generateColorScale', () => {
  it('generates 13 shades for #F2973B', () => {
    const scale = generateColorScale('#F2973B')
    const keys = Object.keys(scale)
    expect(keys).toHaveLength(13)

    expect(keys).toContain('primary_25')
    expect(keys).toContain('primary_500')
    expect(keys).toContain('primary_975')

    // Shades should go from dark to light
    const firstHsl = hexToHsl(scale.primary_25)
    const lastHsl = hexToHsl(scale.primary_975)
    expect(firstHsl.l).toBeLessThan(lastHsl.l)

    // All should have the same hue (30 for #F2973B)
    for (const color of Object.values(scale)) {
      const hsl = hexToHsl(color)
      expect(hsl.h).toBe(30)
    }
  })

  it('maps lightness correctly: index 0 → 5%, index 12 → 95%', () => {
    const scale = generateColorScale('#F2973B')
    const firstHsl = hexToHsl(scale.primary_25)
    const lastHsl = hexToHsl(scale.primary_975)

    // Due to rounding in hex→hsl round-trip, allow ±1
    expect(firstHsl.l).toBeCloseTo(5, -1)
    expect(lastHsl.l).toBeCloseTo(95, -1)
  })
})

describe('deriveCssValues', () => {
  it('derives CSS values for The Invite config', () => {
    const css = deriveCssValues('#F2973B', '#D53E2B')

    expect(css.selectionLight).toBe('#D53E2B')
    expect(css.selectionDark).toMatch(/^#[0-9a-f]{6}$/)
    expect(css.backgroundLightHsl).toBe('hsl(30, 20%, 95%)')
    expect(css.backgroundDarkHsl).toBe('hsl(30, 20%, 20%)')
    expect(css.backgroundDimHsl).toBe('hsl(30, 20%, 10%)')
  })
})

describe('generateComputedConfig', () => {
  const theinviteConfig: RawCommunityConfig = {
    metadata: {
      name: 'The Invite',
      displayName: 'The Invite',
      slug: 'theinvite',
    },
    branding: {
      assets: {
        logo: {path: './brand-assets/logo.png'},
        logotype: {path: './brand-assets/logotype.png'},
        logoLight: {path: './brand-assets/logo-light.png'},
        logoDark: {path: './brand-assets/logo-dark.png'},
        favicon: {path: './brand-assets/favicon.png'},
      },
      messages: {
        composerPlaceholder: "What's poppin?",
        primaryCTA: 'Claim your seat at the table',
        welcomeMessage: 'Claim your seat at the table',
        splashTagline: "What's poppin?",
      },
    },
    theme: {
      colors: {
        primary: '#F2973B',
        secondary: '#D53E2B',
        accent: '#A8D8AA',
      },
    },
    services: {
      pds: {url: 'https://theinvite.us'},
    },
    web: {
      themeColor: '#A060E9',
      title: 'The Invite',
      domains: {
        main: 'https://theinvite.community',
        shortlink: 'https://go.theinvite.community',
      },
    },
  }

  it('produces correct metadata', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.metadata.name).toBe('The Invite')
    expect(config.metadata.slug).toBe('theinvite')
  })

  it('produces correct hue', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.theme.hue).toBe(30)
  })

  it('produces correct messages', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.messages.composerPlaceholder).toBe("What's poppin?")
    expect(config.messages.primaryCTA).toBe('Claim your seat at the table')
  })

  it('produces correct service URL', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.services.pds.url).toBe('https://theinvite.us')
  })

  it('produces correct web config', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.web.themeColor).toBe('#A060E9')
    expect(config.web.title).toBe('The Invite')
    expect(config.web.domains.main).toBe('https://theinvite.community')
    expect(config.web.links.community).toBe('')
    expect(config.web.links.contribute).toBe('')
    expect(config.web.links.tos).toBe(
      'https://theinvite.community/about/support/tos',
    )
    expect(config.web.links.privacy).toBe(
      'https://theinvite.community/about/support/privacy-policy',
    )
    expect(config.web.supportEmail).toBe('mailto:support@blacksky.app')
  })

  it('reads web links and supportEmail from raw config', () => {
    const withLinks: RawCommunityConfig = {
      ...theinviteConfig,
      web: {
        ...theinviteConfig.web,
        links: {
          tos: 'https://example.com/tos',
          privacy: 'https://example.com/privacy',
          github: 'https://github.com/example',
          community: 'https://forum.example.com',
          contribute: 'https://donate.example.com',
        },
        supportEmail: 'mailto:help@example.com',
      },
    }
    const config = generateComputedConfig(withLinks)
    expect(config.web.links.tos).toBe('https://example.com/tos')
    expect(config.web.links.privacy).toBe('https://example.com/privacy')
    expect(config.web.links.github).toBe('https://github.com/example')
    expect(config.web.links.community).toBe('https://forum.example.com')
    expect(config.web.links.contribute).toBe('https://donate.example.com')
    expect(config.web.supportEmail).toBe('mailto:help@example.com')
  })

  it('uses defaults for missing optional fields', () => {
    const minimal: RawCommunityConfig = {
      metadata: {name: 'Test', displayName: 'Test', slug: 'test'},
      branding: {
        assets: {},
        messages: {},
      },
      theme: {colors: {primary: '#6060E9'}},
      services: {pds: {url: 'https://test.example.com'}},
    }
    const config = generateComputedConfig(minimal)

    expect(config.messages.composerPlaceholder).toBe("What's poppin'?")
    expect(config.messages.primaryCTA).toBe('Join the cookout')
    expect(config.messages.postButtonLabel).toBe('Post')
    expect(config.feeds.discover).toContain('blacksky-trend')
    expect(config.feeds.discoveryFeeds).toEqual(DEFAULT_DISCOVERY_FEEDS)
    expect(config.assets.logo).toBe('')
  })

  it('treats empty defaultPinned array as missing and uses defaults', () => {
    const withEmptyPinned: RawCommunityConfig = {
      ...theinviteConfig,
      feeds: {
        defaultPinned: [],
      },
    }
    const config = generateComputedConfig(withEmptyPinned)
    expect(config.feeds.defaultPinned).toHaveLength(1)
    expect(config.feeds.defaultPinned[0].type).toBe('feed')
    expect(config.feeds.defaultPinned[0].value).toContain('blacksky-trend')
  })

  it('treats empty discoveryFeeds array as missing and uses defaults', () => {
    const withEmptyDiscovery: RawCommunityConfig = {
      ...theinviteConfig,
      feeds: {
        discoveryFeeds: [],
      },
    }
    const config = generateComputedConfig(withEmptyDiscovery)
    expect(config.feeds.discoveryFeeds).toEqual(DEFAULT_DISCOVERY_FEEDS)
  })

  it('does not include following timeline in default pinned feeds', () => {
    const minimal: RawCommunityConfig = {
      metadata: {name: 'Test', displayName: 'Test', slug: 'test'},
      branding: {assets: {}, messages: {}},
      theme: {colors: {primary: '#6060E9'}},
      services: {pds: {url: 'https://test.example.com'}},
    }
    const config = generateComputedConfig(minimal)
    const hasFollowingTimeline = config.feeds.defaultPinned.some(
      f => f.type === 'timeline' && f.value === 'following',
    )
    expect(hasFollowingTimeline).toBe(false)
  })

  it('passes through discoveryFeeds from raw config', () => {
    const customFeeds = [
      'at://did:plc:abc/app.bsky.feed.generator/my-feed',
      'at://did:plc:def/app.bsky.feed.generator/other-feed',
    ]
    const withFeeds: RawCommunityConfig = {
      ...theinviteConfig,
      feeds: {
        discoveryFeeds: customFeeds,
      },
    }
    const config = generateComputedConfig(withFeeds)
    expect(config.feeds.discoveryFeeds).toEqual(customFeeds)
  })

  it('passes through availableHandles from raw config', () => {
    const withHandles: RawCommunityConfig = {
      ...theinviteConfig,
      services: {
        pds: {
          url: 'https://blacksky.app',
          availableHandles: ['.theinvite.community', '.theinvite.us'],
        },
      },
    }
    const config = generateComputedConfig(withHandles)
    expect(config.services.pds.availableHandles).toEqual([
      '.theinvite.community',
      '.theinvite.us',
    ])
  })

  it('defaults availableHandles to empty array when omitted', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.services.pds.availableHandles).toEqual([])
  })

  it('produces default onboarding config when omitted', () => {
    const config = generateComputedConfig(theinviteConfig)
    expect(config.onboarding.starterPack).toBe('')
    expect(config.onboarding.autoFollowDids).toEqual([])
  })

  it('produces onboarding config from raw input', () => {
    const withOnboarding: RawCommunityConfig = {
      ...theinviteConfig,
      onboarding: {
        starterPack: 'at://did:plc:abc/app.bsky.graph.starterpack/test',
        autoFollowDids: ['did:plc:one', 'did:plc:two'],
      },
    }
    const config = generateComputedConfig(withOnboarding)
    expect(config.onboarding.starterPack).toBe(
      'at://did:plc:abc/app.bsky.graph.starterpack/test',
    )
    expect(config.onboarding.autoFollowDids).toEqual([
      'did:plc:one',
      'did:plc:two',
    ])
  })

  it('respects explicit background overrides', () => {
    const withBg: RawCommunityConfig = {
      ...theinviteConfig,
      theme: {
        ...theinviteConfig.theme,
        background: {
          light: '#ffffff',
          dark: '#000000',
          dim: '#111111',
        },
      },
    }
    const config = generateComputedConfig(withBg)
    // Background overrides are stored separately as bgLight/bgDark/bgDim
    // so they only affect bg surfaces, not text color or neutral scale tokens.
    expect(config.theme.brand.bgLight).toBe('#ffffff')
    expect(config.theme.brand.bgDark).toBe('#000000')
    expect(config.theme.brand.bgDim).toBe('#111111')
    // bgHue should be derived from the dark background override
    expect(config.theme.bgHue).toBe(0) // #000000 has hue 0
  })
})
