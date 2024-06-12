export type GooglePlayReferrerInfo =
  | {
      installReferrer?: string
      clickTimestamp?: number
      installTimestamp?: number
    }
  | undefined

export type ExpoGooglePlayReferrerModule = {
  getReferrerInfoAsync(): Promise<GooglePlayReferrerInfo>
}
