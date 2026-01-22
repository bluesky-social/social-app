import {type Geolocation} from '#/geolocation'

export type BaseMetadata = {
  deviceId: string
  sessionId: string
  platform: string
  appVersion: string
  bundleIdentifier: string
  bundleDate: number
  referrerSrc: string
  referrerUrl: string
}

export type GeolocationMetadata = Geolocation

export type SessionMetadata = {
  did: string
  isBskyPds: boolean
}

export type PreferencesMetadata = {
  appLanguage: string
  contentLanguages: string[]
}

export type MergeableMetadata = {
  session?: SessionMetadata
  preferences?: PreferencesMetadata
  /**
   * Navigation metadata is not actually available on this object, instead it's
   * merged in at time-of-log/metric. See `#/analytics/metadata.ts` for details.
   */
  navigation?: NavigationMetadata
}

export type Metadata = {
  base: BaseMetadata
  geolocation: GeolocationMetadata
} & MergeableMetadata

/*
 * Navigation metadata is handle out-of-band from React, since we don't want to
 * slow down screen transitions in any way, and there doesn't seem to be a nice
 * way to get current navigation state without an additional re-render between
 * navigations.
 *
 * So instead of this data being available on the Metadata object, it's stored
 * here and merged in at time-of-log/metric.
 */
export type NavigationMetadata = {
  previousScreen?: string
  currentScreen?: string
}
let navigationMetadata: NavigationMetadata | undefined
export function getNavigationMetadata() {
  return navigationMetadata
}
export function setNavigationMetadata(meta: NavigationMetadata | undefined) {
  navigationMetadata = meta
}
