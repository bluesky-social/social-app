import {type Palette} from '@bsky.app/alf'

import {type Brand} from '#/brand/types'
import {EARTH_MARK_SVG} from '../shared/earthMark.svg'
import {
  BRAND_INVITE_REQUEST_URL,
  DEFAULT_BRAND_PAGE_LINKS,
} from '../shared/links'
import nativeConfig from './brand.js'

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
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77.234 115.671">
  <style>
    svg {
      color: #121212;
    }
    @media (prefers-color-scheme: dark) {
      svg {
        color: #FFFFFF;
      }
    }
  </style>
  <g>
    <path fill="currentColor" d="M46.688,37.485,1.674,15.53a2.022,2.022,0,0,1-.31-3.9L34.81.111a2.021,2.021,0,1,1,1.316,3.822L7.4,13.824l41.06,20.027a2.022,2.022,0,1,1-1.772,3.634Z" transform="translate(0 72.474)"/>
    <rect fill="currentColor" width="3.186" height="110.963" rx="1.593" transform="translate(8.042 0)"/>
  </g>
  <g transform="translate(3.793 48.721)">
    <path fill="currentColor" d="M51.16,41.074,1.835,17.017a2.216,2.216,0,0,1-.341-4.277L38.144.122A2.215,2.215,0,1,1,39.586,4.31L8.109,15.148,53.1,37.093a2.215,2.215,0,1,1-1.941,3.982Z" transform="matrix(0.438, 0.899, -0.899, 0.438, 37.119, 0)"/>
    <rect fill="currentColor" width="3.322" height="75.307" rx="1.661" transform="matrix(0.446, 0.895, -0.895, 0.446, 71.959, 15.187)"/>
  </g>
</svg>`

const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 535.428 210.357">
  <defs>
    <clipPath id="cp1"><rect width="65.989" height="95.181" fill="none"/></clipPath>
    <clipPath id="cp2"><rect width="86.994" height="95.181" fill="none"/></clipPath>
    <clipPath id="cp3"><rect width="58.785" height="95.181" fill="none"/></clipPath>
  </defs>
  <g transform="translate(-853.932 -476.904)">
    <g transform="translate(853.932 477)">
      <path d="M87.938,70.6,3.156,29.252A3.807,3.807,0,0,1,2.569,21.9l63-21.692a3.807,3.807,0,1,1,2.479,7.2L13.938,26.039l77.339,37.72A3.808,3.808,0,1,1,87.938,70.6Z" transform="translate(0 136.409)" fill="#d6d6d6"/>
      <rect fill="currentColor" width="6" height="209" rx="3" transform="translate(15.147 -0.096)"/>
    </g>
    <g transform="translate(1263.12 572.181)">
      <path d="M87.938,70.6,3.156,29.252A3.807,3.807,0,0,1,2.569,21.9l63-21.692a3.807,3.807,0,1,1,2.479,7.2L13.938,26.039l77.339,37.72A3.808,3.808,0,1,1,87.938,70.6Z" transform="matrix(0.438, 0.899, -0.899, 0.438, 63.805, 0)" fill="#d6d6d6"/>
      <rect fill="currentColor" width="5.711" height="129.446" rx="2.855" transform="matrix(0.446, 0.895, -0.895, 0.446, 123.691, 26.106)"/>
    </g>
    <g transform="translate(966.384 591.217)">
      <g clip-path="url(#cp1)">
        <path fill="currentColor" d="M54.282,66.556V2.538A2.264,2.264,0,0,0,51.737,0H45.105a3.466,3.466,0,0,0-3.037,1.676L.928,65.129A5.81,5.81,0,0,0,0,68.225v6.752a2.289,2.289,0,0,0,2.538,2.545h40.03V92.644a2.261,2.261,0,0,0,2.538,2.538h6.632a2.264,2.264,0,0,0,2.545-2.538V77.522h9.169a2.264,2.264,0,0,0,2.538-2.545V69.094a2.258,2.258,0,0,0-2.538-2.538ZM42.568,18.777v47.78H12.515Z"/>
      </g>
    </g>
    <g transform="translate(1065.371 591.217)">
      <g clip-path="url(#cp2)">
        <path fill="currentColor" d="M9.255,95.18A2.206,2.206,0,0,0,11.73,92.7V29.473L41.718,70.394a1.951,1.951,0,0,0,3.5,0L75.264,29.473V92.7a2.206,2.206,0,0,0,2.476,2.476h6.772A2.208,2.208,0,0,0,86.994,92.7V4.2c0-4.649-3.33-5.68-6.049-1.87L43.464,53.772,6.049,2.33C3.272-1.48,0-.449,0,4.2V92.7A2.209,2.209,0,0,0,2.484,95.18Z"/>
      </g>
    </g>
    <g transform="translate(1185.299 591.217)">
      <g clip-path="url(#cp3)">
        <path fill="currentColor" d="M56.3,95.181a2.215,2.215,0,0,0,2.486-2.486v-5.83A2.2,2.2,0,0,0,56.3,84.438H21.879L40.517,62.1c10.38-12.386,18.09-20.762,18.09-33.873C58.607,11.831,45.734,0,29.4,0,14.835,0,4.758,8.923,1.361,22.64A2.11,2.11,0,0,0,3.24,25.49L9.619,26.7c1.516.244,2.426-.482,2.848-2,2.368-8.687,8.383-13.963,17.181-13.963A17.244,17.244,0,0,1,47.072,28.227c0,8.678-5.948,15.479-12.564,23.424L.695,92.088c-1.338,1.635-.673,3.093,1.392,3.093Z"/>
      </g>
    </g>
  </g>
</svg>`

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
        'at://did:plc:ieyfjh6ystyufa3a7pi3jw5q/app.bsky.feed.generator/k4m2a',
      pinned: true,
    },
    {
      type: 'timeline',
      value: 'following',
      pinned: true,
    },
  ],

  links: {
    // Brand-page links default to coseeker.org (k4m2a accounts live on the
    // coseeker.org PDS). Infra links stay on the shared Bluesky AppView.
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
    // The k4m2a marks use `currentColor` and read as a wordmark/icon, so the
    // default fill follows the theme text color rather than the brand primary.
    defaultTint: 'text',
    mark: {
      xml: ICON_SVG,
      ratio: 115.671 / 77.234,
    },
    wordmark: {
      xml: WORDMARK_SVG,
      ratio: 210.357 / 535.428,
    },
    logomark: {
      xml: ICON_SVG,
      ratio: 115.671 / 77.234,
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
    logotypeHeaderWidth: 110,
  },

  welcomeModal: {
    headline: 'Together, pave the way for humanity to awaken.',
    subtitle: 'Join the team building the infrastructure for human awakening.',
    primaryLabel: 'I Have an Invite Code',
    secondaryLabel: 'Request Invite Code',
    requestInviteUrl: BRAND_INVITE_REQUEST_URL,
  },
}

export default brand
