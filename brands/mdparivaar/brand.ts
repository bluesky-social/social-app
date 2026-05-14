import {DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE} from '@bsky.app/alf'

import {type Brand} from '#/brand/types'
import nativeConfig from './brand.js'
import {MD_ICON_SVG} from './logoIcon.svg'

/**
 * MDParivaar runtime brand. Visual-testing config: services (PDS, appview,
 * feeds, links) point at bluesky's defaults so the app works end-to-end.
 * Only the visual brand (name, palette, logo) is MDParivaar.
 *
 * To turn this into a real community brand, replace `pds`, `defaultFeeds`,
 * `appAccountDid`, `links`, and `blogUrls`, and flip
 * `features.allowForeignPdsSignup` back to false.
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

const mdparivaarPalette = {
  ...DEFAULT_PALETTE,
  ...MDPARIVAAR_PRIMARY_RAMP,
}

const mdparivaarSubduedPalette = {
  ...DEFAULT_SUBDUED_PALETTE,
  ...MDPARIVAAR_PRIMARY_RAMP,
}

// The MD icon is a self-contained design (white-on-saffron). Rendered via
// SvgXml as-is; theme tinting does not apply because the SVG carries its
// own colors. We use the icon for `mark` (compact), `logomark` (mid), and
// `wordmark` (header) — replace `wordmark` with a real wordmark SVG when
// one becomes available.
const MD_ICON_SHAPE = {
  xml: MD_ICON_SVG,
  ratio: 1, // viewBox is 180x180
}

const brand: Brand = {
  ...nativeConfig,

  // Bluesky-default services for visual testing.
  pds: {
    serviceUrl: 'https://bsky.social',
    serviceDid: 'did:web:bsky.social',
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
    allowForeignPdsSignup: true,
    showStarterPacks: true,
    showLiveNow: true,
  },

  palette: {
    default: mdparivaarPalette,
    subdued: mdparivaarSubduedPalette,
  },

  logo: {
    mark: MD_ICON_SHAPE,
    wordmark: MD_ICON_SHAPE,
    logomark: MD_ICON_SHAPE,
  },
}

export default brand
