import {type AppBskyActorDefs} from '@atproto/api'
import {type Palette} from '@bsky.app/alf'

export type SavedFeed = Pick<
  AppBskyActorDefs.SavedFeed,
  'type' | 'value' | 'pinned'
>

/**
 * Runtime brand definition. One per community. Loaded from
 * `brands/<id>/brand.ts` and selected at boot by hostname (web) or
 * `BRAND` env baked into the app config (native).
 *
 * Adding a field here without populating it on every brand under `brands/`
 * will produce a TypeScript error at the brand definition site.
 */
export type Brand = {
  id: string
  name: string
  spokenName: string
  scheme: string

  pds: {
    serviceUrl: string
    serviceDid: string
    publicService: string
    appview: string
    appviewDid: string
  }

  defaultFeeds: SavedFeed[]
  appAccountDid: string

  links: {
    helpDesk: string
    statusPage: string
    download: string
    embedService: string
    gifService: string
    videoService: string
    videoServiceDid: string
    tos: string
    privacy: string
    community: string
    communityDeprecated: string
  }

  blogUrls: {
    findFriendsAnnouncement: string
    initialVerificationAnnouncement: string
    searchTipsAndTricks: string
    findFriendsPrivacyPolicy: string
  }

  features: {
    allowForeignPdsSignup: boolean
    showStarterPacks: boolean
    showLiveNow: boolean
  }

  primaryColor: string

  /**
   * Full palette ramps consumed by `src/alf/themes.ts`. Brands are required
   * to supply both the default and subdued ramps. To start a new brand, copy
   * `DEFAULT_PALETTE` / `DEFAULT_SUBDUED_PALETTE` from `@bsky.app/alf` and
   * hand-tune. Auto-generation from a single hex tends to produce muddy
   * results for non-blue hues; we deliberately don't ship a generator.
   */
  palette: {
    default: Palette
    subdued: Palette
  }

  /**
   * SVG path data + viewBox for the brand's logo shapes. The wrappers
   * (`src/view/icons/Logo.tsx` etc.) own the sizing, theming, and gradient
   * logic; brands supply only the path data so they don't have to
   * re-implement the wrapper.
   */
  logo: {
    /** Primary mark used in Logo.tsx (supports gradient fill + kawaii mode) */
    mark: SvgShape
    /** Wordmark / typeface used in Logotype.tsx */
    wordmark: SvgShape
    /** Combined logomark variant used in Logomark.tsx */
    logomark: SvgShape
    /**
     * Optional kawaii-mode raster fallbacks. Bluesky-only easter egg; other
     * brands can omit this and the kawaii toggle will simply render the
     * regular mark.
     */
    kawaiiAssets?: {
      large: number // result of require('./assets/...png')
      small: number
    }
  }
}

export type SvgShape = {
  /** SVG `viewBox` attribute, e.g. `'0 0 64 57'`. */
  viewBox: string
  /** SVG path `d` attribute. */
  path: string
  /** height-to-width ratio for layout, derived from the viewBox. */
  ratio: number
}
