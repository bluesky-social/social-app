import {DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE} from '@bsky.app/alf'

import {type Brand} from '#/brand/types'
import {
  BRAND_INVITE_REQUEST_URL,
  DEFAULT_BRAND_PAGE_LINKS,
} from '../shared/links'
import nativeConfig from './brand.js'
import {MD_ICON_SVG} from './logoIcon.svg'

/**
 * MDParivaar runtime brand. Accounts live on the self-hosted PDS at
 * coseeker.org; reads still go through bluesky's public appview. The
 * `defaultFeeds`, `appAccountDid`, `links`, and `blogUrls` fields still
 * reference bluesky-owned resources — swap them for MDParivaar-owned
 * values as those become available.
 *
 * To activate locally:
 *   EXPO_PUBLIC_BRAND=mdparivaar yarn web
 *   EXPO_PUBLIC_BRAND=mdparivaar yarn ios
 */

// Saffron primary ramp anchored on the brand's `#CD7233` (sampled from the
// icon SVG). primary_500 is what most "primary" UI elements render with;
// hover/press use 600/700, surfaces use 25-100.
const MDPARIVAAR_PRIMARY_RAMP = {
  primary_25: '#FDF6F0',
  primary_50: '#FAEAD9',
  primary_100: '#F5D2B0',
  primary_200: '#EFB17F',
  primary_300: '#E89557',
  primary_400: '#DC8042',
  primary_500: '#CD7233',
  primary_600: '#B35F26',
  primary_700: '#8A4A1F',
  primary_800: '#6B3717',
  primary_900: '#4F280F',
  primary_950: '#3A1D0A',
  primary_975: '#241208',
}

const MDPARIVAAR_CONTRASTS = {
  // Only override high contrast values (700-1000) for custom dark-mode warm-brown backgrounds and surfaces
  contrast_700: '#B19688', // Premium warm sandstone text/icons
  contrast_800: '#423028', // Active elements
  contrast_900: '#30221C', // Elegant warm border
  contrast_950: '#241814', // Warm card/surface background
  contrast_975: '#1C120E', // Hover state
  contrast_1000: '#150D0A', // Deep near-black warm cocoa background for dark mode (instead of #000000)
}

const MDPARIVAAR_SUBDUED_CONTRASTS = {
  // Subdued overrides for custom dim-mode warm-brown backgrounds and surfaces
  contrast_700: '#C5A898', // Soft sandstone text/icons
  contrast_800: '#543E33', // Active elements
  contrast_900: '#3F2E26', // Elegant dim border
  contrast_950: '#32231D', // Dim card/surface background
  contrast_975: '#271B16', // Hover state
  contrast_1000: '#1E1410', // Comfortable warm dim cocoa background for dim mode (instead of #151D28)
}

const mdparivaarPalette = {
  ...DEFAULT_PALETTE,
  ...MDPARIVAAR_PRIMARY_RAMP,
  ...MDPARIVAAR_CONTRASTS,
}

const mdparivaarSubduedPalette = {
  ...DEFAULT_SUBDUED_PALETTE,
  ...MDPARIVAAR_PRIMARY_RAMP,
  ...MDPARIVAAR_SUBDUED_CONTRASTS,
}

// The MD icon is a self-contained design (white-on-saffron). Rendered via
// SvgXml as-is; theme tinting does not apply because the SVG carries its
// own colors. We use the icon for `mark` (compact) and `logomark` (mid).
const MD_ICON_SHAPE = {
  xml: MD_ICON_SVG,
  ratio: 1, // viewBox is 180x180
}

// Custom wordmark SVG for "MD Parivaar" text.
const MD_WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 126 24">
  <text x="50%" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Outfit', 'Inter', sans-serif" font-weight="900" font-size="20" fill="currentColor" text-anchor="middle">MD Parivaar</text>
</svg>`

const MD_WORDMARK_SHAPE = {
  xml: MD_WORDMARK_SVG,
  ratio: 24 / 126,
}

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

  appAccountDid: 'did:plc:ieyfjh6ystyufa3a7pi3jw5q', // @coseeker.com

  defaultFeeds: [
    {
      type: 'feed',
      value:
        'at://did:plc:ieyfjh6ystyufa3a7pi3jw5q/app.bsky.feed.generator/md-parivaar',
      pinned: true,
    },
    {
      type: 'timeline',
      value: 'following',
      pinned: true,
    },
  ],

  links: {
    // Brand-page links default to coseeker.org (mdparivaar accounts live on the
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
    default: mdparivaarPalette,
    subdued: mdparivaarSubduedPalette,
  },

  logo: {
    mark: MD_ICON_SHAPE,
    wordmark: MD_WORDMARK_SHAPE,
    logomark: MD_ICON_SHAPE,
  },

  welcomeModal: {
    headline: 'व्यक्ति सार्थक संवाद से, बोध तक सार्थक होना संभव है।',
    attribution: '- श्री ए. नागराज',
    subtitle: 'संवाद और अध्ययन के आधार पर ही निष्ठा निकलती है।',
    primaryLabel: 'I Have an Invite Code',
    secondaryLabel: 'Request Invite Code',
    requestInviteUrl: BRAND_INVITE_REQUEST_URL,
  },
}

export default brand
