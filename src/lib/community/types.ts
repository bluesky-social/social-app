/**
 * Types for the community branding system.
 *
 * RawCommunityConfig: input format (matches *.config.json files)
 * ComputedBrandConfig: output format (fully resolved, ready for runtime use)
 * BrandColors: the BRAND constant shape used by themes.ts
 */

// ---------------------------------------------------------------------------
// Input types (raw config JSON)
// ---------------------------------------------------------------------------

export interface RawAssetConfig {
  path: string
  description?: string
}

export interface RawCommunityConfig {
  metadata: {
    name: string
    displayName: string
    slug: string
    description?: string
    version?: string
    /** DID whose starter packs should populate the onboarding "suggested" list */
    communityDid?: string
  }
  branding: {
    assets: {
      logo?: RawAssetConfig
      logotype?: RawAssetConfig
      logoLight?: RawAssetConfig
      logoDark?: RawAssetConfig
      favicon?: RawAssetConfig
      splashLight?: RawAssetConfig
      splashDark?: RawAssetConfig
      logoSvg?: RawAssetConfig
      socialCard?: RawAssetConfig
    }
    messages: {
      composerPlaceholder?: string
      primaryCTA?: string
      welcomeMessage?: string
      splashTagline?: string
      migrationMessage?: string | null
      /** Label for the post/compose button (e.g. "Serve", "Post"). Defaults to "Post". */
      postButtonLabel?: string
    }
  }
  theme: {
    colors: {
      primary: string
      secondary?: string
      accent?: string
    }
    background?: {
      light?: string
      dark?: string
      dim?: string
    }
  }
  services: {
    pds: {
      url: string
      description?: string
      /** Handle domains available for this community (e.g. [".theinvite.us"]) */
      availableHandles?: string[]
    }
    /** DIDs of moderation services new users should subscribe to */
    moderation?: string[]
  }
  web?: {
    themeColor?: string
    title?: string
    domains?: {
      main?: string
      shortlink?: string
    }
    links?: {
      tos?: string
      privacy?: string
      github?: string
      community?: string
      contribute?: string
    }
    supportEmail?: string
  }
  feeds?: {
    discover?: string
    video?: string
    defaultPinned?: Array<{type: string; value: string; pinned: boolean}>
    /** Feed URIs shown in the Feeds discovery tab */
    discoveryFeeds?: string[]
  }
  onboarding?: {
    /** Default starter pack URI — applied to all new signups unless they arrived via a different starter pack */
    starterPack?: string
    /** DIDs of accounts every new user should auto-follow */
    autoFollowDids?: string[]
  }
}

// ---------------------------------------------------------------------------
// Output types (computed config)
// ---------------------------------------------------------------------------

/** Matches the shape of the BRAND constant in src/alf/themes.ts */
export interface BrandColors {
  black: string
  white: string
  twilight: string
  gray300: string
  gray400: string
  gray600: string
  primaryLight: string
  primaryLightTint: string
  primaryDark: string
  primaryDarkTint: string
  secondary: string
  secondaryTint: string
  negative: string
  /** Explicit background override for light mode (only affects bg surface, not text/shadows) */
  bgLight?: string
  /** Explicit background override for dark mode (only affects bg surface, not text/shadows) */
  bgDark?: string
  /** Explicit background override for dim mode (only affects bg surface, not text/shadows) */
  bgDim?: string
}

export interface GradientStop {
  position: number
  color: string
}

export interface ComputedBrandConfig {
  metadata: {
    name: string
    displayName: string
    slug: string
    /** DID whose starter packs should populate the onboarding "suggested" list. Null when unset. */
    communityDid: string | null
  }
  theme: {
    hue: number
    bgHue: number
    brand: BrandColors
    gradients: {
      primary: GradientStop[]
      sky: GradientStop[]
      sunset: GradientStop[]
    }
    colorScale: Record<string, string>
    css: {
      selectionLight: string
      selectionDark: string
      backgroundLightHsl: string
      backgroundDarkHsl: string
      backgroundDimHsl: string
    }
  }
  messages: {
    composerPlaceholder: string
    primaryCTA: string
    welcomeMessage: string
    splashTagline: string
    migrationMessage: string | null
    postButtonLabel: string
  }
  assets: {
    logo: string
    logoDark: string
    logoLight: string
    logotype: string
    favicon: string
    socialCard: string
  }
  feeds: {
    discover: string
    video: string
    defaultPinned: Array<{type: string; value: string; pinned: boolean}>
    /** Feed URIs shown in the Feeds discovery tab */
    discoveryFeeds: string[]
  }
  onboarding: {
    starterPack: string
    autoFollowDids: string[]
  }
  services: {
    pds: {
      url: string
      /** Handle domains available for this community (e.g. [".theinvite.us"]) */
      availableHandles: string[]
    }
    /** DIDs of moderation services new users should subscribe to */
    moderation: string[]
  }
  web: {
    themeColor: string
    title: string
    domains: {
      main: string
      shortlink: string
    }
    links: {
      about: string
      tos: string
      privacy: string
      github: string
      community: string
      contribute: string
    }
    supportEmail: string
  }
}
