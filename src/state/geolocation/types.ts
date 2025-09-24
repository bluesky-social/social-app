export type DeviceLocation = {
  countryCode: string | undefined
  regionCode: string | undefined
}

export type GeolocationStatus = DeviceLocation & {
  isAgeRestrictedGeo: boolean
  isAgeBlockedGeo: boolean
}
