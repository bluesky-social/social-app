import {z} from 'zod'
import {deviceLocales} from '#/platform/detection'

// only data needed for rendering account page
// TODO agent.resumeSession requires the following fields
const accountSchema = z.object({
  service: z.string(),
  did: z.string(),
  handle: z.string(),
  email: z.string(),
  emailConfirmed: z.boolean(),
  refreshJwt: z.string().optional(), // optional because it can expire
  accessJwt: z.string().optional(), // optional because it can expire
  // displayName: z.string().optional(),
  // aviUrl: z.string().optional(),
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
  }),
  requireAltTextEnabled: z.boolean(), // should move to server
  mutedThreads: z.array(z.string()), // should move to server
  invites: z.object({
    copiedInvites: z.array(z.string()),
  }),
  onboarding: z.object({
    step: z.string(),
  }),
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
  },
  requireAltTextEnabled: false,
  mutedThreads: [],
  invites: {
    copiedInvites: [],
  },
  onboarding: {
    step: 'Home',
  },
}
