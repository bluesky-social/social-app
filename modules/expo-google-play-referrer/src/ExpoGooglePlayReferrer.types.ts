export type GooglePlayReferrerInfo = {
  installReferrer: string
  clickTimestamp: number
  installTimestamp: number
}

export type ExpoGooglePlayReferrerModule = {
  getReferrerInfoAsync(): Promise<GooglePlayReferrerInfo>
}
