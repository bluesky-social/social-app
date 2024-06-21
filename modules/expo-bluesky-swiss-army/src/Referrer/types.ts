export type GooglePlayReferrerInfo =
  | {
      installReferrer?: string
      clickTimestamp?: number
      installTimestamp?: number
    }
  | undefined
