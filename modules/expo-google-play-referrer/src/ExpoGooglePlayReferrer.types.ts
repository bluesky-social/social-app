export type GooglePlayReferrerInfo = {}

export type ExpoGooglePlayReferrerModule = {
  getReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null>
}
