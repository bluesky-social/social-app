import {DEFAULT_PALETTE, DEFAULT_SUBDUED_PALETTE} from '@bsky.app/alf'

import {type Brand} from '#/brand/types'
import {DEFAULT_BRAND_PAGE_LINKS} from '../shared/links'
import nativeConfig from './brand.js'

/**
 * Bluesky runtime brand. Recreates the upstream Bluesky behavior exactly so
 * that with no `EXPO_PUBLIC_BRAND` set (native) or unmatched hostname (web),
 * the app is indistinguishable from `main`.
 *
 * Identity + native-build fields come from `./brand.js` via the spread
 * below. Keep all such fields in `brand.js` (it's the file `app.config.js`
 * reads at native build time). Add runtime-only fields (PDS, feeds, links,
 * palette, logo) here.
 */
const brand: Brand = {
  ...nativeConfig,

  pds: {
    name: 'Bluesky Social',
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
    // Spread the coseeker.org defaults, then override every brand-page link
    // back to Bluesky's own URLs so the Bluesky brand is unchanged from upstream.
    ...DEFAULT_BRAND_PAGE_LINKS,
    helpDesk: 'https://blueskyweb.zendesk.com/hc/en-us',
    feedbackForm: 'https://blueskyweb.zendesk.com/hc/en-us/requests/new',
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
    copyright: 'https://bsky.social/about/support/copyright',
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
    showTrending: true,
  },

  palette: {
    default: DEFAULT_PALETTE,
    subdued: DEFAULT_SUBDUED_PALETTE,
  },

  logo: {
    mark: {
      viewBox: '0 0 64 57',
      ratio: 57 / 64,
      path: 'M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z',
    },
    wordmark: {
      viewBox: '0 0 64 17',
      ratio: 17 / 64,
      path: 'M8.478 6.252c1.503.538 2.3 1.78 2.3 3.172 0 2.356-1.576 3.785-4.6 3.785H0V0h5.974c2.875 0 4.267 1.466 4.267 3.413 0 1.3-.594 2.245-1.763 2.839Zm-2.69-4.193H2.504v3.45h3.284c1.28 0 1.967-.667 1.967-1.78 0-1.02-.705-1.67-1.967-1.67Zm-3.284 9.072h3.544c1.41 0 2.17-.65 2.17-1.818 0-1.224-.723-1.837-2.17-1.837H2.504v3.655ZM14.251 13.209h-2.337V0h2.337v13.209ZM22.001 8.998V3.636h2.338v9.573h-2.263v-1.392c-.724 1.076-1.726 1.614-3.006 1.614-2.022 0-3.34-1.224-3.34-3.45V3.636h2.338v5.955c0 1.206.594 1.818 1.8 1.818 1.132 0 2.133-.835 2.133-2.411ZM34.979 8.59v.556h-7.161c.167 1.651 1.076 2.467 2.486 2.467 1.076 0 1.8-.463 2.189-1.372h2.244c-.5 1.947-2.17 3.19-4.452 3.19-1.428 0-2.579-.463-3.45-1.372-.872-.91-1.318-2.115-1.318-3.637 0-1.502.427-2.708 1.299-3.636.872-.909 2.004-1.372 3.432-1.372 1.447 0 2.597.482 3.45 1.428.854.946 1.28 2.208 1.28 3.747Zm-4.75-3.358c-1.28 0-2.17.742-2.393 2.281h4.805c-.204-1.391-1.057-2.281-2.411-2.281ZM40.16 13.469c-2.783 0-4.249-1.095-4.379-3.303h2.282c.13 1.188.724 1.633 2.134 1.633 1.261 0 1.892-.39 1.892-1.15 0-.687-.445-1.02-1.874-1.262l-1.094-.185c-2.097-.353-3.136-1.318-3.136-2.894 0-1.8 1.429-2.894 3.97-2.894 2.728 0 4.138 1.075 4.23 3.246h-2.207c-.056-1.169-.742-1.577-2.023-1.577-1.113 0-1.67.371-1.67 1.113 0 .668.483.965 1.596 1.169l1.206.186c2.32.426 3.32 1.28 3.32 2.912 0 1.93-1.557 3.006-4.247 3.006ZM54.667 13.209h-2.671l-2.783-4.453-1.447 1.447v3.006h-2.3V0h2.3v7.606l3.896-3.97h2.783l-3.618 3.618 3.84 5.955ZM60.772 6.048l.78-2.412H64l-3.692 10.352c-.39 1.057-.872 1.818-1.484 2.245-.612.426-1.484.63-2.634.63-.39 0-.724-.018-1.02-.055V14.97h.89c1.057 0 1.577-.65 1.577-1.54 0-.445-.149-1.094-.446-1.929l-2.746-7.866h2.487l.779 2.393c.575 1.8 1.076 3.58 1.521 5.343.408-1.521.928-3.302 1.54-5.324Z',
    },
    logomark: {
      viewBox: '0 0 61 54',
      ratio: 54 / 61,
      path: 'M13.223 3.602C20.215 8.832 27.738 19.439 30.5 25.13c2.762-5.691 10.284-16.297 17.278-21.528C52.824-.172 61-3.093 61 6.2c0 1.856-1.068 15.59-1.694 17.82-2.178 7.752-10.112 9.73-17.17 8.532 12.337 2.092 15.475 9.021 8.697 15.95-12.872 13.159-18.5-3.302-19.943-7.52-.264-.773-.388-1.135-.39-.827-.002-.308-.126.054-.39.827-1.442 4.218-7.071 20.679-19.943 7.52-6.778-6.929-3.64-13.858 8.697-15.95-7.058 1.197-14.992-.78-17.17-8.532C1.068 21.79 0 8.056 0 6.2 0-3.093 8.176-.172 13.223 3.602Z',
    },
    kawaiiAssets: {
      large: require('../../assets/kawaii.png'),
      small: require('../../assets/kawaii_smol.png'),
    },
  },

  welcomeModal: {
    headline: 'Real people.\nReal conversations.\nSocial media you control.',
    primaryLabel: 'Create account',
    // Open signup, no invite required; the secondary CTA just dismisses.
    secondaryLabel: 'Explore the app',
  },
}

export default brand
