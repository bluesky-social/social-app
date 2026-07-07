import React from 'react'

import {DEFAULT_BLUE_HUE} from '#/alf/util/colorGeneration'
import {generateComputedConfig} from '#/lib/community/configGenerator'
import {
  type BrandColors,
  type ComputedBrandConfig,
  type RawCommunityConfig,
} from '#/lib/community/types'
import {DISCOVER_FEED_URI, VIDEO_FEED_URI} from '#/lib/constants'

// Blacksky defaults used as the dev-mode fallback when no brand config is
// injected by bskyweb (i.e. when running `yarn web` locally).
const BLACKSKY_CONFIG: RawCommunityConfig = {
  metadata: {
    name: 'Blacksky',
    displayName: 'Blacksky',
    slug: 'blacksky',
    description:
      'Decentralized social media built for community power, culture, and collective freedom.',
    communityDid: 'did:plc:w4es6sfejnpqztrwcbot6gxt',
  },
  branding: {
    assets: {},
    messages: {
      composerPlaceholder: "What's poppin'?",
      primaryCTA: 'Join the cookout',
      welcomeMessage: 'Welcome to the cookout!',
      splashTagline: "What's poppin'?",
      postButtonLabel: 'Post',
    },
  },
  theme: {
    colors: {
      primary: '#6060E9',
    },
  },
  services: {
    pds: {
      url: 'https://blacksky.app',
    },
  },
  feeds: {
    defaultPinned: [
      {
        type: 'feed',
        value: DISCOVER_FEED_URI,
        pinned: true,
      },
      {type: 'timeline', value: 'following', pinned: true},
      {
        type: 'feed',
        value: VIDEO_FEED_URI,
        pinned: true,
      },
    ],
  },
  web: {
    themeColor: '#6060E9',
    title: 'Blacksky',
    domains: {
      main: 'https://blacksky.community',
      shortlink: 'https://go.blacksky.community',
    },
  },
}

const BLACKSKY_BRAND: BrandColors = {
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
}

const BLACKSKY_PRIMARY_SCALE = {
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
}

// In multi-brand mode, bskyweb injects the config into the HTML before React loads.
// In dev mode (yarn web), fall back to the Blacksky defaults above.
function resolveBrandConfig(): ComputedBrandConfig {
  if (typeof window !== 'undefined' && window.__BRAND_CONFIG__) {
    return window.__BRAND_CONFIG__
  }

  const config = generateComputedConfig(BLACKSKY_CONFIG)
  return {
    ...config,
    theme: {
      ...config.theme,
      hue: DEFAULT_BLUE_HUE,
      bgHue: DEFAULT_BLUE_HUE,
      brand: BLACKSKY_BRAND,
      colorScale: BLACKSKY_PRIMARY_SCALE,
      css: {
        ...config.theme.css,
        selectionLight: '#D2FC51',
        selectionDark: '#464985',
      },
    },
  }
}

export const DEFAULT_BRAND_CONFIG = resolveBrandConfig()

// Hostname-only form of the main brand domain (e.g. "blacksky.community"),
// used as the browser tab-title suffix.
export const BRAND_DOMAIN =
  (DEFAULT_BRAND_CONFIG.web.domains.main || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '') || DEFAULT_BRAND_CONFIG.web.title

// Inject CSS custom properties at module scope (before React renders) to avoid flash
if (typeof document !== 'undefined') {
  const root = document.documentElement
  const css = DEFAULT_BRAND_CONFIG.theme.css
  const brandTheme = DEFAULT_BRAND_CONFIG.theme.brand
  root.style.setProperty('--brand-hue', String(DEFAULT_BRAND_CONFIG.theme.hue))
  root.style.setProperty(
    '--brand-bg-light',
    brandTheme.bgLight || brandTheme.white,
  )
  root.style.setProperty(
    '--brand-bg-dark',
    brandTheme.bgDark || brandTheme.black,
  )
  root.style.setProperty(
    '--brand-bg-dim',
    brandTheme.bgDim || brandTheme.twilight,
  )
  root.style.setProperty('--brand-selection-light', css.selectionLight)
  root.style.setProperty('--brand-selection-dark', css.selectionDark)

  // Update HTML meta tags
  const setMeta = (selector: string, value: string) => {
    const el = document.querySelector(selector)
    if (el) (el as HTMLMetaElement).content = value
  }
  setMeta('meta[name="theme-color"]', DEFAULT_BRAND_CONFIG.web.themeColor)

  // Replace the build-time %WEB_TITLE% placeholder with the brand domain so
  // the browser tab reflects the active brand before React mounts.
  document.title = BRAND_DOMAIN

  // Update preconnect links
  const preconnects = document.querySelectorAll('link[rel="preconnect"]')
  const domains = [
    DEFAULT_BRAND_CONFIG.web.domains.main,
    DEFAULT_BRAND_CONFIG.web.domains.shortlink,
  ].filter(Boolean)
  preconnects.forEach((el, i) => {
    if (domains[i]) (el as HTMLLinkElement).href = domains[i]
  })
}

const BrandContext =
  React.createContext<ComputedBrandConfig>(DEFAULT_BRAND_CONFIG)

export function BrandProvider({
  children,
  config,
}: React.PropsWithChildren<{config?: ComputedBrandConfig}>) {
  return (
    <BrandContext.Provider value={config || DEFAULT_BRAND_CONFIG}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand(): ComputedBrandConfig {
  return React.useContext(BrandContext)
}
