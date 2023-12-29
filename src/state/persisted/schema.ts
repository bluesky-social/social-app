import {z} from 'zod'
import {deviceLocales} from '#/platform/detection'

const externalEmbedOptions = ['ask', 'show', 'hide'] as const

// only data needed for rendering account page
const accountSchema = z.object({
  service: z.string(),
  did: z.string(),
  handle: z.string(),
  email: z.string().optional(),
  emailConfirmed: z.boolean().optional(),
  refreshJwt: z.string().optional(), // optional because it can expire
  accessJwt: z.string().optional(), // optional because it can expire
})
export type PersistedAccount = z.infer<typeof accountSchema>

export const schema = z.object({
  colorMode: z.enum(['system', 'light', 'dark']),
  session: z.object({
    accounts: z.array(accountSchema),
    currentAccount: accountSchema.optional(),
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
  externalEmbeds: z.object({
    giphy: z.enum(externalEmbedOptions),
    tenor: z.enum(externalEmbedOptions),
    youtube: z.enum(externalEmbedOptions),
    twitch: z.enum(externalEmbedOptions),
    vimeo: z.enum(externalEmbedOptions),
    spotify: z.enum(externalEmbedOptions),
    appleMusic: z.enum(externalEmbedOptions),
    soundcloud: z.enum(externalEmbedOptions),
  }),
  mutedThreads: z.array(z.string()), // should move to server
  invites: z.object({
    copiedInvites: z.array(z.string()),
  }),
  onboarding: z.object({
    step: z.string(),
  }),
  hiddenPosts: z.array(z.string()).optional(), // should move to server
})
export type Schema = z.infer<typeof schema>

export const defaults: Schema = {
  colorMode: 'system',
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
  externalEmbeds: {
    giphy: 'ask',
    tenor: 'ask',
    youtube: 'ask',
    twitch: 'ask',
    vimeo: 'ask',
    spotify: 'ask',
    appleMusic: 'ask',
    soundcloud: 'ask',
  },
  mutedThreads: [],
  invites: {
    copiedInvites: [],
  },
  onboarding: {
    step: 'Home',
  },
  hiddenPosts: [],
}
