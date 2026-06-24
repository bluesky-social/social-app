import {type Palette} from '@bsky.app/alf'

import {type Brand} from '#/brand/types'
import {EARTH_MARK_SVG} from '../shared/earthMark.svg'
import {
  BRAND_INVITE_REQUEST_URL,
  DEFAULT_BRAND_PAGE_LINKS,
} from '../shared/links'
import nativeConfig from './brand.js'
import {COSEEKER_WORDMARK_SVG} from './wordmark.svg'

/**
 * Light-theme palette. Plain static values - no call-stack inspection. The
 * dark and dim themes are derived from `k4m2aPaletteDark` /
 * `k4m2aSubduedPaletteDark` below via `invertPalette` in `src/alf/themes.ts`.
 */
const k4m2aPalette: Palette = {
  white: '#FFFFFF',
  black: '#000000',
  pink: '#EC4899',
  yellow: '#FFC404',
  like: '#EC4899',

  // Pure neutral system-style gray ramp (light backgrounds and dark text)
  contrast_0: '#FFFFFF',
  contrast_25: '#FAFAFA',
  contrast_50: '#E5E5EA',
  contrast_100: '#E1E1E6',
  contrast_200: '#D1D1D6',
  contrast_300: '#3C3C3E',
  contrast_400: '#555555',
  contrast_500: '#444444',
  contrast_600: '#000000',
  contrast_700: '#222222',
  contrast_800: '#121212',
  contrast_900: '#0A0A0A',
  contrast_950: '#050505',
  contrast_975: '#000000',
  contrast_1000: '#000000',

  primary_25: '#FAFAFA',
  primary_50: '#F4F4F6',
  primary_100: '#E5E5EA',
  primary_200: '#D1D1D6',
  primary_300: '#C7C7CC',
  primary_400: '#AEAEB2',
  primary_500: '#000000',
  primary_600: '#121212',
  primary_700: '#222222',
  primary_800: '#333333',
  primary_900: '#444444',
  primary_950: '#555555',
  primary_975: '#666666',

  positive_25: '#ECFEF5',
  positive_50: '#D3FDE8',
  positive_100: '#A3FACF',
  positive_200: '#6AF6B0',
  positive_300: '#2CF28F',
  positive_400: '#0DD370',
  positive_500: '#09B35E',
  positive_600: '#04904A',
  positive_700: '#036D38',
  positive_800: '#04522B',
  positive_900: '#033F21',
  positive_950: '#032A17',
  positive_975: '#021D0F',

  negative_25: '#FFF5F7',
  negative_50: '#FEE7EC',
  negative_100: '#FDD3DD',
  negative_200: '#FBBBCA',
  negative_300: '#F891A9',
  negative_400: '#F65A7F',
  negative_500: '#E91646',
  negative_600: '#CA123D',
  negative_700: '#A71134',
  negative_800: '#7F0B26',
  negative_900: '#5F071C',
  negative_950: '#430413',
  negative_975: '#30030D',
}

/**
 * Pre-inversion dark source for the default palette. `invertPalette` mirrors
 * ramp positions (contrast_0 <-> contrast_1000, etc.) and keeps midpoints, so
 * these are the hand-tuned values that a naive inversion of the light ramp
 * would not produce. Only the slots that differ from `k4m2aPalette` are
 * listed; the rest are inherited.
 */
const k4m2aPaletteDark: Palette = {
  ...k4m2aPalette,
  contrast_100: '#FFFFFF',
  contrast_300: '#FFFFFF',
  contrast_400: '#FFFFFF',
  contrast_500: '#8E8E93',
  contrast_600: '#AEAEB2',
  contrast_700: '#FFFFFF',
  contrast_800: '#3F3F3F',
  contrast_900: '#2A2A2A',
  contrast_950: '#1A1A1C',
  contrast_975: '#151515',
  contrast_1000: '#0D0D0D',
  primary_400: '#FFFFFF',
  primary_500: '#FFFFFF',
  primary_600: '#FAFAFA',
  primary_700: '#F4F4F6',
  primary_800: '#E5E5EA',
  primary_900: '#2C2C2E',
  primary_950: '#2A2A2C',
  primary_975: '#2C2C2E',
}

const k4m2aSubduedPalette: Palette = {
  white: '#FFFFFF',
  black: '#000000',
  pink: '#EC4899',
  yellow: '#FFC404',
  like: '#EC4899',

  // Pure neutral system-style gray ramp
  contrast_0: '#FFFFFF',
  contrast_25: '#FAFAFA',
  contrast_50: '#F4F4F6',
  contrast_100: '#E5E5EA',
  contrast_200: '#D1D1D6',
  contrast_300: '#3C3C3E',
  contrast_400: '#555555',
  contrast_500: '#444444',
  contrast_600: '#000000',
  contrast_700: '#222222',
  contrast_800: '#121212',
  contrast_900: '#0A0A0A',
  contrast_950: '#050505',
  contrast_975: '#000000',
  contrast_1000: '#000000',

  primary_25: '#FAFAFA',
  primary_50: '#F4F4F6',
  primary_100: '#E5E5EA',
  primary_200: '#D1D1D6',
  primary_300: '#C7C7CC',
  primary_400: '#AEAEB2',
  primary_500: '#000000',
  primary_600: '#121212',
  primary_700: '#222222',
  primary_800: '#333333',
  primary_900: '#444444',
  primary_950: '#555555',
  primary_975: '#666666',

  positive_25: '#ECFEF5',
  positive_50: '#D8FDEB',
  positive_100: '#A8FAD1',
  positive_200: '#6FF6B3',
  positive_300: '#31F291',
  positive_400: '#0EDD75',
  positive_500: '#0AC266',
  positive_600: '#049F52',
  positive_700: '#038142',
  positive_800: '#056636',
  positive_900: '#04522B',
  positive_950: '#053D21',
  positive_975: '#052917',

  negative_25: '#FFF5F7',
  negative_50: '#FEEBEF',
  negative_100: '#FDD8E1',
  negative_200: '#FCC0CE',
  negative_300: '#F99AB0',
  negative_400: '#F76486',
  negative_500: '#EB2452',
  negative_600: '#D81341',
  negative_700: '#BA1239',
  negative_800: '#910D2C',
  negative_900: '#6F0B22',
  negative_950: '#500B1C',
  negative_975: '#3E0915',
}

/**
 * Pre-inversion dark source for the subdued palette (drives the dim theme).
 * Only the slots that differ from `k4m2aSubduedPalette` are listed.
 */
const k4m2aSubduedPaletteDark: Palette = {
  ...k4m2aSubduedPalette,
  contrast_300: '#FFFFFF',
  contrast_400: '#FFFFFF',
  contrast_500: '#A3A3A3',
  contrast_600: '#AEAEB2',
  contrast_700: '#FFFFFF',
  contrast_800: '#A3A3A3',
  contrast_900: '#666666',
  contrast_950: '#2E2E30',
  contrast_975: '#222222',
  contrast_1000: '#121212',
  primary_400: '#FFFFFF',
  primary_500: '#FFFFFF',
  primary_600: '#FAFAFA',
  primary_700: '#F4F4F6',
  primary_800: '#E5E5EA',
  primary_900: '#2C2C2E',
  primary_950: '#3A3A3C',
  primary_975: '#2C2C2E',
}

// Inline icon SVG (black "k_____a" mark). Default fills swapped to
// `currentColor` so the wrapper can recolor for light/dark themes; the gray
// accent strokes stay literal `#d6d6d6` because they're a brand decision.
const brand: Brand = {
  ...nativeConfig,

  pds: {
    name: 'CoSeeker',
    serviceUrl: 'https://coseeker.org',
    serviceDid: 'did:web:coseeker.org',
    publicService: 'https://public.api.bsky.app',
    appview: 'https://api.bsky.app',
    appviewDid: 'did:web:api.bsky.app',
  },

  appAccountDid: 'did:plc:z72i7hdynmk6r22z27h6tvur',

  defaultFeeds: [
    {
      type: 'feed',
      value:
        'at://did:plc:ieyfjh6ystyufa3a7pi3jw5q/app.bsky.feed.generator/coseeker',
      pinned: true,
    },
    {
      type: 'timeline',
      value: 'following',
      pinned: true,
    },
  ],

  links: {
    // Brand-page links (help, feedback, tos, privacy, community, copyright)
    // default to coseeker.org via DEFAULT_BRAND_PAGE_LINKS. Infra links below
    // intentionally still point at the shared Bluesky AppView services that
    // CoSeeker's PDS relies on.
    ...DEFAULT_BRAND_PAGE_LINKS,
    statusPage: 'https://status.bsky.app/',
    download: 'https://bsky.app/download',
    embedService: 'https://embed.bsky.app',
    gifService: 'https://gifs.bsky.app',
    videoService: 'https://video.bsky.app',
    videoServiceDid: 'did:web:video.bsky.app',
  },

  blogUrls: {
    findFriendsAnnouncement:
      'https://bsky.social/about/blog/12-16-2025-find-friends',
    initialVerificationAnnouncement:
      'https://bsky.social/about/blog/04-21-2025-verification',
    searchTipsAndTricks: 'https://bsky.social/about/blog/05-31-2024-search',
    findFriendsPrivacyPolicy:
      'https://bsky.social/about/support/find-friends-privacy-policy',
  },

  features: {
    allowForeignPdsSignup: false,
    showStarterPacks: true,
    showLiveNow: true,
    showTrending: false,
  },

  palette: {
    default: k4m2aPalette,
    subdued: k4m2aSubduedPalette,
    defaultDark: k4m2aPaletteDark,
    subduedDark: k4m2aSubduedPaletteDark,
  },

  logo: {
    // CoSeeker's earth globe is shared with k4m2a (../shared/earthMark.svg);
    // only the "CoSeeker" wordmark is brand-specific. The wordmark uses
    // `currentColor`, so the default fill follows the theme text color rather
    // than the brand primary.
    defaultTint: 'text',
    mark: {
      xml: EARTH_MARK_SVG,
      ratio: 1,
      scale: 1.8,
    },
    wordmark: {
      xml: COSEEKER_WORDMARK_SVG,
      ratio: 180 / 932,
    },
    logomark: {
      xml: EARTH_MARK_SVG,
      ratio: 1,
      scale: 1.8,
    },
    splashMark: {
      xml: EARTH_MARK_SVG,
      ratio: 1,
      scale: 1.8,
    },
    tabBarMark: {
      xml: EARTH_MARK_SVG,
      ratio: 1,
      scale: 1.8,
    },
    appAccountMark: {
      xml: EARTH_MARK_SVG,
      ratio: 1,
      scale: 1.8,
    },
    logotypeHeaderWidth: 150,
  },

  welcomeModal: {
    headline: 'Conversations to understand consciousness',
    subtitle: 'CoSeeker is invite-only for sincere seekers.',
    primaryLabel: 'I Have an Invite Code',
    secondaryLabel: 'Request Invite Code',
    requestInviteUrl: BRAND_INVITE_REQUEST_URL,
  },
}

export default brand
