import {z} from 'zod'

import {deviceLocales, prefersReducedMotion} from '#/platform/detection'

const externalEmbedOptions = ['show', 'hide'] as const

/**
 * A account persisted to storage. Stored in the `accounts[]` array. Contains
 * base account info and access tokens.
 */
const accountSchema = z.object({
  service: z.string(),
  did: z.string(),
  handle: z.string(),
  email: z.string().optional(),
  emailConfirmed: z.boolean().optional(),
  emailAuthFactor: z.boolean().optional(),
  refreshJwt: z.string().optional(), // optional because it can expire
  accessJwt: z.string().optional(), // optional because it can expire
  signupQueued: z.boolean().optional(),
  active: z.boolean().optional(), // optional for backwards compat
  /**
   * Known values: takendown, suspended, deactivated
   * @see https://github.com/bluesky-social/atproto/blob/5441fbde9ed3b22463e91481ec80cb095643e141/lexicons/com/atproto/server/getSession.json
   */
  status: z.string().optional(),
  pdsUrl: z.string().optional(),
})
export type PersistedAccount = z.infer<typeof accountSchema>

/**
 * The current account. Stored in the `currentAccount` field.
 *
 * In previous versions, this included tokens and other info. Now, it's used
 * only to reference the `did` field, and all other fields are marked as
 * optional. They should be considered deprecated and not used, but are kept
 * here for backwards compat.
 */
const currentAccountSchema = accountSchema.extend({
  service: z.string().optional(),
  handle: z.string().optional(),
})
export type PersistedCurrentAccount = z.infer<typeof currentAccountSchema>

export const schema = z.object({
  colorMode: z.enum(['system', 'light', 'dark']),
  darkTheme: z.enum(['dim', 'dark']).optional(),
  session: z.object({
    accounts: z.array(accountSchema),
    currentAccount: currentAccountSchema.optional(),
  }),
  reminders: z.object({
    lastEmailConfirm: z.string().optional(),
  }),
  languagePrefs: z.object({
    primaryLanguage: z.string(), // should move to server
    contentLanguages: z.array(z.string()), // should move to server
    postLanguage: z.string(), // should move to server
    postLanguageHistory: z.array(z.string()),
    appLanguage: z.string(),
  }),
  requireAltTextEnabled: z.boolean(), // should move to server
  largeAltBadgeEnabled: z.boolean().optional(),
  externalEmbeds: z
    .object({
      giphy: z.enum(externalEmbedOptions).optional(),
      tenor: z.enum(externalEmbedOptions).optional(),
      youtube: z.enum(externalEmbedOptions).optional(),
      youtubeShorts: z.enum(externalEmbedOptions).optional(),
      twitch: z.enum(externalEmbedOptions).optional(),
      vimeo: z.enum(externalEmbedOptions).optional(),
      spotify: z.enum(externalEmbedOptions).optional(),
      appleMusic: z.enum(externalEmbedOptions).optional(),
      soundcloud: z.enum(externalEmbedOptions).optional(),
      flickr: z.enum(externalEmbedOptions).optional(),
    })
    .optional(),
  invites: z.object({
    copiedInvites: z.array(z.string()),
  }),
  onboarding: z.object({
    step: z.string(),
  }),
  hiddenPosts: z.array(z.string()).optional(), // should move to server
  useInAppBrowser: z.boolean().optional(),
  lastSelectedHomeFeed: z.string().optional(),
  pdsAddressHistory: z.array(z.string()).optional(),
  disableHaptics: z.boolean().optional(),
  disableAutoplay: z.boolean().optional(),
  kawaii: z.boolean().optional(),
  hasCheckedForStarterPack: z.boolean().optional(),
  /** @deprecated */
  mutedThreads: z.array(z.string()),
})
export type Schema = z.infer<typeof schema>

export const defaults: Schema = {
  colorMode: 'system',
  darkTheme: 'dim',
  session: {
    accounts: [],
    currentAccount: undefined,
  },
  reminders: {
    lastEmailConfirm: undefined,
  },
  languagePrefs: {
    primaryLanguage: deviceLocales[0] || 'en',
    contentLanguages: deviceLocales || [],
    postLanguage: deviceLocales[0] || 'en',
    postLanguageHistory: (deviceLocales || [])
      .concat(['en', 'ja', 'pt', 'de'])
      .slice(0, 6),
    appLanguage: deviceLocales[0] || 'en',
  },
  requireAltTextEnabled: false,
  largeAltBadgeEnabled: false,
  externalEmbeds: {},
  mutedThreads: [],
  invites: {
    copiedInvites: [],
  },
  onboarding: {
    step: 'Home',
  },
  hiddenPosts: [],
  useInAppBrowser: undefined,
  lastSelectedHomeFeed: undefined,
  pdsAddressHistory: [],
  disableHaptics: false,
  disableAutoplay: prefersReducedMotion,
  kawaii: false,
  hasCheckedForStarterPack: false,
}
