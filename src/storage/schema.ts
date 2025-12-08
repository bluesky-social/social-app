import {type ID as PolicyUpdate202508} from '#/components/PolicyUpdateOverlay/updates/202508/config'
import {type Geolocation} from '#/geolocation/types'

/**
 * Device data that's specific to the device and does not vary based account
 */
export type Device = {
  fontScale: '-2' | '-1' | '0' | '1' | '2'
  fontFamily: 'system' | 'theme'
  lastNuxDialog: string | undefined

  /**
   * Geolocation config, fetched from the IP service. This previously did
   * double duty as the "status" for geolocation state, but that has since
   * moved here to the client.
   *
   * @deprecated use `mergedGeolocation` instead
   */
  geolocation?: {
    countryCode: string | undefined
    regionCode: string | undefined
    ageRestrictedGeos: {
      countryCode: string
      regionCode: string | undefined
    }[]
    ageBlockedGeos: {
      countryCode: string
      regionCode: string | undefined
    }[]
  }

  /**
   * The raw response from the geolocation service, if available. We
   * cache this here and update it lazily on session start.
   */
  geolocationServiceResponse?: Geolocation
  /**
   * The GPS-based geolocation, if the user has granted permission.
   */
  deviceGeolocation?: Geolocation
  /**
   * The merged geolocation, combining `geolocationServiceResponse` and
   * `deviceGeolocation`, with preference to `deviceGeolocation`.
   */
  mergedGeolocation?: Geolocation

  trendingBetaEnabled: boolean
  devMode: boolean
  demoMode: boolean
  activitySubscriptionsNudged?: boolean
  threadgateNudged?: boolean

  /**
   * Policy update overlays. New IDs are required for each new announcement.
   */
  policyUpdateDebugOverride?: boolean
  [PolicyUpdate202508]?: boolean
}

export type Account = {
  searchTermHistory?: string[]
  searchAccountHistory?: string[]

  /**
   * The ISO date string of when this account's birthdate was last updated on
   * this device.
   */
  birthdateLastUpdatedAt?: string

  /**
   * Composer draft, saved when the user has unsent content in the post composer.
   * Keyed by context (e.g., 'default', reply URI, etc.)
   */
  composerDraft?: {
    [context: string]: ComposerDraft
  }
}

export type ComposerDraft = {
  version: 1
  timestamp: number
  thread: {
    posts: Array<{
      id: string
      text: string
      labels: string[]
      embed: {
        quoteUri?: string
        linkUri?: string
        images?: Array<{
          alt: string
          path: string
          width: number
          height: number
          mime: string
        }>
        gif?: {
          id: string
          media_formats: unknown
          title: string
          alt: string
        }
        video?: {
          blobRef: unknown
          width: number
          height: number
          mimeType: string
          altText: string
        }
      }
    }>
    postgate: unknown
    threadgate: unknown
  }
  activePostIndex: number
}
