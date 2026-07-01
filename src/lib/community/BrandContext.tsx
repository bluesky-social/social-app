import React from 'react'

import {generateComputedConfig} from '#/lib/community/configGenerator'
import {
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

// In multi-brand mode, bskyweb injects the config into the HTML before React loads.
// In dev mode (yarn web), fall back to the Blacksky defaults above.
function resolveBrandConfig(): ComputedBrandConfig {
  if (typeof window !== 'undefined' && window.__BRAND_CONFIG__) {
    return window.__BRAND_CONFIG__
  }
  return generateComputedConfig(BLACKSKY_CONFIG)
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
