import {type Gif} from '#/features/gifPicker/types'
import {type InviteThemeKey} from '#/features/inviteFriends/themes'

/**
 * Data that's specific to the device and does not vary based account
 */
export type Device = {
  inviteFriendsFollowersPromoDismissed?: boolean
  inviteFriendsThemeKey?: InviteThemeKey
  /**
   * Formerly managed by StatSig, this is the migrated stable ID for the
   * device, used with our logging and metrics tracking.
   */
  deviceId?: string
  /**
   * Session ID storage for _native only_. On web, use we `sessionStorage`
   */
  nativeSessionId?: string
  nativeSessionIdLastEventAt?: number

  fontScale: '-2' | '-1' | '0' | '1' | '2'
  fontFamily: 'system' | 'theme'
  lastNuxDialog: string | undefined
  geolocation?: {
    countryCode: string | undefined
  }
  trendingBetaEnabled: boolean
  devMode: boolean
  demoMode: boolean
  activitySubscriptionsNudged?: boolean
  threadgateNudged?: boolean
}

export type Account = {
  searchTermHistory?: string[]
  searchAccountHistory?: string[]

  /**
   * The ISO date string of when this account's birthdate was last updated on
   * this device.
   */
  birthdateLastUpdatedAt?: string

  lastSelectedHomeFeed?: string

  /**
   * Recently selected GIFs in the GIF picker. Most recent first, capped at 20.
   */
  recentGifs?: Gif[]
}
