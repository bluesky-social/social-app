import {deviceLocales} from '#/platform/detection'

// only data needed for rendering account page
type Account = {
  service: string
  did: `did:plc:${string}`
  refreshJwt: string
  accessJwt: string
  handle: string
  displayName: string
  aviUrl: string
}

export type Schema = {
  colorMode: 'system' | 'light' | 'dark'
  accounts: Account[]
  currentAccount: Account | undefined
  lastEmailConfirmReminder: string | undefined

  // preferences
  primaryLanguage: string // should move to server
  contentLanguages: string[] // should move to server
  postLanguage: string // should move to server
  postLanguageHistory: string[] // should move to server
  requireAltTextEnabled: boolean // should move to server
  mutedThreads: string[] // should move to server

  // should move to server?
  invitedUsers: {
    seenDids: string[]
    copiedInvites: string[]
  }

  onboarding: {
    step: string
  }
}

export const schema: Schema = {
  colorMode: 'system',
  accounts: [],
  currentAccount: undefined,
  lastEmailConfirmReminder: undefined,
  primaryLanguage: deviceLocales[0] || 'en',
  contentLanguages: deviceLocales || [],
  postLanguage: deviceLocales[0] || 'en',
  postLanguageHistory: (deviceLocales || [])
    .concat(['en', 'ja', 'pt', 'de'])
    .slice(0, 6),
  requireAltTextEnabled: false,
  mutedThreads: [],
  invitedUsers: {
    seenDids: [],
    copiedInvites: [],
  },
  onboarding: {
    step: 'Home',
  },
}
