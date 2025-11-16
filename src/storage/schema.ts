import {type ID as PolicyUpdate202508} from '#/components/PolicyUpdateOverlay/updates/202508/config'

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
   * The GPS-based geolocation, if the user has granted permission.
   */
  deviceGeolocation?: {
    countryCode: string | undefined
    regionCode: string | undefined
  }

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
}
