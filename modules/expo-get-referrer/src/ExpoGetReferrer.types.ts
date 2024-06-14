export type ExpoGetReferrerModule = {
  getGooglePlayReferrerInfoAsync: () => Promise<GooglePlayReferrerInfo>
  getReferrerInfoAsync: () => Promise<{
    referrer: string
    hostname: string
  } | null>
}

export type GooglePlayReferrerInfo =
  | {
      installReferrer?: string
      clickTimestamp?: number
      installTimestamp?: number
    }
  | undefined
