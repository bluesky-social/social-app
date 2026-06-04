import {type AppBskyActorDefs} from '@atproto/api'
import {type Palette} from '@bsky.app/alf'

import {type BrandConfig} from '../../brands/types'

export type SavedFeed = Pick<
  AppBskyActorDefs.SavedFeed,
  'type' | 'value' | 'pinned'
>

/**
 * Runtime brand definition. One per community. Loaded from
 * `brands/<id>/brand.ts` and selected at boot by hostname (web) or
 * `EXPO_PUBLIC_BRAND` baked into the app config (native).
 *
 * Composed from `BrandConfig` (the Node-safe identity + native-build fields
 * read by `app.config.js`) plus the runtime-only fields below. Brand authors
 * never redeclare identity fields — they live in `brand.js` and flow through
 * via `import nativeConfig from './brand.js'; const brand = {...nativeConfig, ...}`.
 */
export type Brand = BrandConfig & {
  pds: {
    /**
     * Human-readable name of the hosting provider, shown in signin /
     * signup UI (e.g. "Bluesky Social", "CoSeeker"). Distinct from
     * `brand.name`: the brand is the app; the PDS is who hosts accounts.
     */
    name: string
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
    /** Optional earth logo mark */
    earth?: SvgShape
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

/**
 * Logo shape. Two modes:
 *
 * - **Path mode** — single-path SVG with dynamic fill. The wrapper renders
 *   `<Svg viewBox><Path d={path} fill={...}/></Svg>` and supports the wrapper's
 *   `fill` prop for runtime theming. Use this when the logo is one shape.
 * - **XML mode** — raw SVG string. The wrapper renders `<SvgXml xml={xml}/>`
 *   verbatim. Use for multi-element logos (rect + path, transforms, multiple
 *   colors). Set fills inside the XML to `currentColor` to allow the wrapper's
 *   `fill` prop to recolor them; literal hex fills are preserved as-is.
 */
export type SvgShape =
  | {
      viewBox: string
      path: string
      ratio: number
      scale?: number
    }
  | {
      xml: string
      ratio: number
      scale?: number
    }
