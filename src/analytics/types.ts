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

export type NavigationMetadata = {
  previousScreen?: string
  currentScreen?: string
}

export type SessionMetadata = {
  did: string
  isBskyPds: boolean
}

export type PreferencesMetadata = {
  appLanguage: string
  contentLanguages: string[]
}

export type MergeableMetadata = {
  navigation?: NavigationMetadata
  session?: SessionMetadata
  preferences?: PreferencesMetadata
}

export type Metadata = {
  base: BaseMetadata
  geolocation: GeolocationMetadata
} & MergeableMetadata
