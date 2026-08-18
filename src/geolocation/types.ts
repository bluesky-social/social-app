export type Geolocation = {
  countryCode: string | undefined
  regionCode: string | undefined
  serviceGeolocation?: Geolocation
  deviceGeolocation?: Geolocation
}
