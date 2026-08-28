export type Geolocation = {
  countryCode: string | undefined
  regionCode: string | undefined
  /** Only populated by the IP-based geolocation service. */
  city?: string
  serviceGeolocation?: Geolocation
  deviceGeolocation?: Geolocation
}
