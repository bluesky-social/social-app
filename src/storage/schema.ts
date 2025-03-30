import {
  type PostDraft,
  type ThreadDraft,
} from '#/view/com/composer/state/composer'

/**
 * Device data that's specific to the device and does not vary based account
 */
export type Device = {
  fontScale: '-2' | '-1' | '0' | '1' | '2'
  fontFamily: 'system' | 'theme'
  lastNuxDialog: string | undefined
  geolocation?: {
    countryCode: string | undefined
  }
  trendingBetaEnabled: boolean
  devMode: boolean
}

export type Account = {
  searchTermHistory?: string[]
  searchAccountHistory?: string[]
}

export enum DraftType {
  Post = 0,
  Thread = 1,
}

/**
 * Post draft data that's specific to the account
 */
export type Draft = {
  type: DraftType
  post?: PostDraft
  thread?: ThreadDraft
}

export type Drafts = {
  drafts?: Draft[]
}
