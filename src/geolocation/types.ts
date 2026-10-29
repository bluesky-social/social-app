export type Geolocation = {
  countryCode: string | undefined
  regionCode: string | undefined
  /** Only populated by the IP-based geolocation service. */
  city?: string
  /** Only populated by the IP-based geolocation service. */
  ip?: string
  serviceGeolocation?: Geolocation
  deviceGeolocation?: Geolocation
}
