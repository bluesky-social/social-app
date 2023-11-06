// import {LabelPreference} from '@atproto/api'

/**
 * The shape of the object we store in local storage
 */
export type Schema = {
  shell: {
    colorMode: 'system' | 'light' | 'dark'
  }
  // session: {
  //   data: {
  //     service: string
  //     did: `did:plc:${string}`
  //   }
  //   accounts: {
  //     service: string
  //     did: `did:plc:${string}`
  //     refreshJwt: string
  //     accessJwt: string
  //     handle: string
  //     email: string
  //     displayName: string
  //     aviUrl: string
  //     emailConfirmed: boolean
  //   }[]
  // }
  // me: {
  //   did: `did:plc:${string}`
  //   handle: string
  //   displayName: string
  //   description: string
  //   avatar: string
  // }
  // onboarding: {
  //   step: string
  // }
  // preferences: {
  //   primaryLanguage: string
  //   contentLanguages: string[]
  //   postLanguage: string
  //   postLanguageHistory: string[]
  //   contentLabels: {
  //     nsfw: LabelPreference
  //     nudity: LabelPreference
  //     suggestive: LabelPreference
  //     gore: LabelPreference
  //     hate: LabelPreference
  //     spam: LabelPreference
  //     impersonation: LabelPreference
  //   }
  //   savedFeeds: string[]
  //   pinnedFeeds: string[]
  //   requireAltTextEnabled: boolean
  // }
  // invitedUsers: {
  //   seenDids: string[]
  //   copiedInvites: string[]
  // }
  // mutedThreads: {uris: string[]}
  // reminders: {lastEmailConfirm: string}
}

/**
 * A map of all the properties that can be stored in the storage, and their
 * values. This mapping must be updated in order to get/set values by their
 * keypaths.
 */
export type PropertyMap = {
  'shell.colorMode': Schema['shell']['colorMode']
}
