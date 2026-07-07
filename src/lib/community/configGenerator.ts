/**
 * Community branding config generator.
 *
 * Pure function module: takes a raw community config JSON and computes
 * the full branding payload (colors, gradients, shades, etc.).
 *
 * All color math is ported 1:1 from scripts/apply-whitelabel.js to
 * ensure identical output.
 */

import {
  type BrandColors,
  type ComputedBrandConfig,
  type GradientStop,
  type RawCommunityConfig,
} from './types'

// ---------------------------------------------------------------------------
// Color math (ported from apply-whitelabel.js lines 99-254)
// ---------------------------------------------------------------------------

interface HSL {
  h: number
  s: number
  l: number
}

export function hexToHsl(hex: string): HSL {
  hex = hex.replace(/^#/, '')

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / diff + 2) / 6
        break
      case b:
        h = ((r - g) / diff + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360
  s = s / 100
  l = l / 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// ---------------------------------------------------------------------------
// Gradient generation (ported from apply-whitelabel.js lines 186-254)
// ---------------------------------------------------------------------------

/** 4-stop gradient for primary brand color */
export function generatePrimaryGradient(baseHex: string): GradientStop[] {
  const hsl = hexToHsl(baseHex)

  const darker = hslToHex(
    hsl.h,
    Math.max(0, hsl.s - 10),
    Math.max(0, hsl.l - 20),
  )
  const lighter = hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 15))

  return [
    {position: 0, color: darker},
    {position: 0.4, color: baseHex},
    {position: 0.6, color: baseHex},
    {position: 1, color: lighter},
  ]
}

/** 2-stop gradient for secondary color */
export function generateSecondaryGradient(baseHex: string): GradientStop[] {
  const hsl = hexToHsl(baseHex)

  const darker = hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 15))
  const lighter = hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 20))

  return [
    {position: 0, color: darker},
    {position: 1, color: lighter},
  ]
}

/** 3-stop gradient for accent color */
export function generateAccentGradient(baseHex: string): GradientStop[] {
  const hsl = hexToHsl(baseHex)

  const darker = hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 12))
  const lighter = hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 18))

  return [
    {position: 0, color: darker},
    {position: 0.6, color: baseHex},
    {position: 1, color: lighter},
  ]
}

// ---------------------------------------------------------------------------
// BRAND constant derivation (ported from apply-whitelabel.js lines 602-646)
// ---------------------------------------------------------------------------

export function deriveBrandColors(
  primary: string,
  secondary?: string,
): BrandColors {
  const primaryHsl = hexToHsl(primary)

  // primaryLight: the primary color itself
  const primaryLight = primary.toUpperCase()
  // primaryLightTint: very light background tint (high lightness, reduced saturation)
  const primaryLightTint = hslToHex(
    primaryHsl.h,
    Math.max(10, primaryHsl.s - 40),
    93,
  ).toUpperCase()
  // primaryDark: brighter variant for dark mode (higher lightness)
  const primaryDark = hslToHex(
    primaryHsl.h,
    primaryHsl.s,
    Math.min(75, primaryHsl.l + 15),
  ).toUpperCase()
  // primaryDarkTint: muted dark tint for dark mode backgrounds
  const primaryDarkTint = hslToHex(
    primaryHsl.h,
    Math.max(10, primaryHsl.s - 30),
    30,
  ).toUpperCase()

  let secondaryColor = '#D53E2B'
  let secondaryTintColor = '#EFDEDC'

  if (secondary) {
    const secHsl = hexToHsl(secondary)
    secondaryColor = secondary.toUpperCase()
    secondaryTintColor = hslToHex(
      secHsl.h,
      Math.max(10, secHsl.s - 30),
      90,
    ).toUpperCase()
  }

  // Auto-generate backgrounds from primary hue
  const bgLight = hslToHex(primaryHsl.h, 15, 97)
  const bgDark = hslToHex(primaryHsl.h, 15, 4)
  const bgDim = hslToHex(primaryHsl.h, 15, 12)

  return {
    black: bgDark,
    white: bgLight,
    twilight: bgDim,
    gray300: '#C8CAC9',
    gray400: '#9C9E9E',
    gray600: '#6A6A6A',
    primaryLight,
    primaryLightTint,
    primaryDark,
    primaryDarkTint,
    secondary: secondaryColor,
    secondaryTint: secondaryTintColor,
    negative: '#F40B42',
  }
}

// ---------------------------------------------------------------------------
// 13-shade color scale (ported from apply-whitelabel.js lines 550-583)
// ---------------------------------------------------------------------------

const COLOR_SCALE_KEYS = [
  'primary_25',
  'primary_50',
  'primary_100',
  'primary_200',
  'primary_300',
  'primary_400',
  'primary_500',
  'primary_600',
  'primary_700',
  'primary_800',
  'primary_900',
  'primary_950',
  'primary_975',
] as const

export function generateColorScale(primary: string): Record<string, string> {
  const hsl = hexToHsl(primary)
  const scale: Record<string, string> = {}

  for (let i = 0; i < 13; i++) {
    const lightness = 5 + i * 7.5
    scale[COLOR_SCALE_KEYS[i]] = hslToHex(hsl.h, hsl.s, lightness)
  }

  return scale
}

// ---------------------------------------------------------------------------
// CSS derived values (ported from apply-whitelabel.js lines 1257-1299)
// ---------------------------------------------------------------------------

export function deriveCssValues(
  primary: string,
  secondary?: string,
): ComputedBrandConfig['theme']['css'] {
  const primaryHsl = hexToHsl(primary)
  const hue = primaryHsl.h

  const selectionLight = secondary || '#D53E2B'
  const selectionDark = hslToHex(hue, Math.max(10, primaryHsl.s - 30), 30)

  return {
    selectionLight,
    selectionDark,
    backgroundLightHsl: `hsl(${hue}, 20%, 95%)`,
    backgroundDarkHsl: `hsl(${hue}, 20%, 20%)`,
    backgroundDimHsl: `hsl(${hue}, 20%, 10%)`,
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

// Default feed URIs (Blacksky)
const DEFAULT_DISCOVER_FEED =
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-trend'
const DEFAULT_VIDEO_FEED =
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-videos'
export const DEFAULT_DISCOVERY_FEEDS = [
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-trend',
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky',
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-edu',
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-op',
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-videos',
  'at://did:plc:w4xbfzo7kqfes5zb7r6qv3rw/app.bsky.feed.generator/blacksky-photos',
  'at://did:plc:3guzzweuqraryl3rdkimjamk/app.bsky.feed.generator/for-you',
]

export function generateComputedConfig(
  raw: RawCommunityConfig,
): ComputedBrandConfig {
  const primary = raw.theme.colors.primary
  const secondary = raw.theme.colors.secondary
  const accent = raw.theme.colors.accent
  const hue = hexToHsl(primary).h
  const bgHue = raw.theme.background?.dark
    ? hexToHsl(raw.theme.background.dark).h
    : hue

  // Derive BRAND colors
  const brand = deriveBrandColors(primary, secondary)
  // Store explicit background overrides separately so they only affect bg
  // surfaces, not text color, shadows, or neutral scale tokens.
  if (raw.theme.background?.light) brand.bgLight = raw.theme.background.light
  if (raw.theme.background?.dark) brand.bgDark = raw.theme.background.dark
  if (raw.theme.background?.dim) brand.bgDim = raw.theme.background.dim

  // Generate gradients
  const primaryGradient = generatePrimaryGradient(primary)
  const skyGradient = secondary
    ? generateSecondaryGradient(secondary)
    : [
        {position: 0, color: '#952B1D'},
        {position: 1, color: '#E68B7F'},
      ]
  const sunsetGradient = accent
    ? generateAccentGradient(accent)
    : [
        {position: 0, color: '#72C075'},
        {position: 0.6, color: '#B0DBB3'},
        {position: 1, color: '#EDF7EE'},
      ]

  const discoverFeed = raw.feeds?.discover || DEFAULT_DISCOVER_FEED
  const videoFeed = raw.feeds?.video || DEFAULT_VIDEO_FEED

  const mainDomain = raw.web?.domains?.main || 'https://blacksky.community'

  return {
    metadata: {
      name: raw.metadata.name,
      displayName: raw.metadata.displayName,
      slug: raw.metadata.slug,
      communityDid: raw.metadata.communityDid ?? null,
    },
    theme: {
      hue,
      bgHue,
      brand,
      gradients: {
        primary: primaryGradient,
        sky: skyGradient,
        sunset: sunsetGradient,
      },
      colorScale: generateColorScale(primary),
      css: deriveCssValues(primary, secondary),
    },
    messages: {
      composerPlaceholder:
        raw.branding.messages?.composerPlaceholder || "What's poppin'?",
      primaryCTA: raw.branding.messages?.primaryCTA || 'Join the cookout',
      welcomeMessage:
        raw.branding.messages?.welcomeMessage || 'Welcome to the cookout!',
      splashTagline: raw.branding.messages?.splashTagline || "What's poppin'?",
      migrationMessage:
        raw.branding.messages?.migrationMessage !== undefined
          ? raw.branding.messages.migrationMessage
          : 'Migrating from Bluesky? Use move.blacksky.community to move your followers, posts, and media to Blacksky.',
      postButtonLabel: raw.branding.messages?.postButtonLabel || 'Post',
    },
    assets: {
      logo: raw.branding.assets.logo?.path || '',
      logoDark: raw.branding.assets.logoDark?.path || '',
      logoLight: raw.branding.assets.logoLight?.path || '',
      logotype: raw.branding.assets.logotype?.path || '',
      favicon: raw.branding.assets.favicon?.path || '',
      socialCard: raw.branding.assets.socialCard?.path || '',
    },
    feeds: {
      discover: discoverFeed,
      video: videoFeed,
      defaultPinned: raw.feeds?.defaultPinned?.length
        ? raw.feeds.defaultPinned
        : [{type: 'feed', value: discoverFeed, pinned: true}],
      discoveryFeeds: raw.feeds?.discoveryFeeds?.length
        ? raw.feeds.discoveryFeeds
        : DEFAULT_DISCOVERY_FEEDS,
    },
    onboarding: {
      starterPack: raw.onboarding?.starterPack || '',
      autoFollowDids: raw.onboarding?.autoFollowDids || [],
    },
    services: {
      pds: {
        url: raw.services.pds.url,
        availableHandles: raw.services.pds.availableHandles || [],
      },
    },
    web: {
      themeColor: raw.web?.themeColor || primary,
      title: raw.web?.title || raw.metadata.displayName,
      domains: {
        main: mainDomain,
        shortlink: raw.web?.domains?.shortlink || '',
      },
      links: {
        about: mainDomain,
        tos: raw.web?.links?.tos || `${mainDomain}/about/support/tos`,
        privacy:
          raw.web?.links?.privacy ||
          `${mainDomain}/about/support/privacy-policy`,
        github:
          raw.web?.links?.github || 'https://github.com/blacksky-algorithms',
        community: raw.web?.links?.community || '',
        contribute: raw.web?.links?.contribute || '',
      },
      supportEmail: raw.web?.supportEmail || 'mailto:support@blacksky.app',
    },
  }
}
