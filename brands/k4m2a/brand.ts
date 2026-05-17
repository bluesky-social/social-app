import {DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE} from '@bsky.app/alf'

import {type Brand} from '#/brand/types'
import nativeConfig from './brand.js'

/**
 * k4m2a runtime brand. Accounts live on the self-hosted PDS at
 * coseeker.org; reads still go through bluesky's public appview. The
 * `defaultFeeds`, `appAccountDid`, `links`, and `blogUrls` fields still
 * reference bluesky-owned resources — swap them for k4m2a-owned values
 * as those become available.
 *
 * To activate locally:
 *   EXPO_PUBLIC_BRAND=k4m2a yarn web
 *   EXPO_PUBLIC_BRAND=k4m2a yarn ios
 *
 * Web hostname mapping lives in `src/brand/resolve.web.ts`.
 */

// Monochrome primary ramp tuned to the k4m2a brand book (#000, #333, #4C4C4C
// dark; #D6D6D6, #C5C5C5 light). primary_500 is what most "primary" UI
// elements (buttons, focus rings) render with.
const K4M2A_PRIMARY_RAMP = {
  primary_25: '#FAFAFA',
  primary_50: '#F2F2F2',
  primary_100: '#E5E5E5',
  primary_200: '#D6D6D6',
  primary_300: '#C5C5C5',
  primary_400: '#9E9E9E',
  primary_500: '#4C4C4C',
  primary_600: '#333333',
  primary_700: '#1F1F1F',
  primary_800: '#141414',
  primary_900: '#0A0A0A',
  primary_950: '#050505',
  primary_975: '#000000',
}

const k4m2aPalette = {
  ...DEFAULT_PALETTE,
  ...K4M2A_PRIMARY_RAMP,
}

const k4m2aSubduedPalette = {
  ...DEFAULT_SUBDUED_PALETTE,
  ...K4M2A_PRIMARY_RAMP,
}

// Inline icon SVG (black "k_____a" mark). Default fills swapped to
// `currentColor` so the wrapper can recolor for light/dark themes; the gray
// accent strokes stay literal `#d6d6d6` because they're a brand decision.
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77.234 115.671">
  <g>
    <path fill="currentColor" d="M46.688,37.485,1.674,15.53a2.022,2.022,0,0,1-.31-3.9L34.81.111a2.021,2.021,0,1,1,1.316,3.822L7.4,13.824l41.06,20.027a2.022,2.022,0,1,1-1.772,3.634Z" transform="translate(0 72.474)"/>
    <rect fill="currentColor" width="3.186" height="110.963" rx="1.593" transform="translate(8.042 0)"/>
  </g>
  <g transform="translate(3.793 48.721)">
    <path fill="currentColor" d="M51.16,41.074,1.835,17.017a2.216,2.216,0,0,1-.341-4.277L38.144.122A2.215,2.215,0,1,1,39.586,4.31L8.109,15.148,53.1,37.093a2.215,2.215,0,1,1-1.941,3.982Z" transform="matrix(0.438, 0.899, -0.899, 0.438, 37.119, 0)"/>
    <rect fill="currentColor" width="3.322" height="75.307" rx="1.661" transform="matrix(0.446, 0.895, -0.895, 0.446, 71.959, 15.187)"/>
  </g>
</svg>`

// Inline wordmark SVG (full "k4m2a" text). Same currentColor convention; the
// two `#d6d6d6` accent strokes (left of "k", right of "a") are part of the
// brand identity and stay literal.
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
        'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
      pinned: true,
    },
    {
      type: 'timeline',
      value: 'following',
      pinned: true,
    },
  ],

  links: {
    helpDesk: 'https://blueskyweb.zendesk.com/hc/en-us',
    statusPage: 'https://status.bsky.app/',
    download: 'https://bsky.app/download',
    embedService: 'https://embed.bsky.app',
    gifService: 'https://gifs.bsky.app',
    videoService: 'https://video.bsky.app',
    videoServiceDid: 'did:web:video.bsky.app',
    tos: 'https://bsky.social/about/support/tos',
    privacy: 'https://bsky.social/about/support/privacy-policy',
    community: 'https://bsky.social/about/support/community-guidelines',
    communityDeprecated:
      'https://bsky.social/about/support/community-guidelines-deprecated',
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
  },

  palette: {
    default: k4m2aPalette,
    subdued: k4m2aSubduedPalette,
  },

  logo: {
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
  },
}

export default brand
