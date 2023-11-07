import {z} from 'zod'
import {deviceLocales} from '#/platform/detection'

// only data needed for rendering account page
const accountSchema = z.object({
  service: z.string(),
  did: z.string(),
  refreshJwt: z.string(),
  accessJwt: z.string(),
  handle: z.string(),
  displayName: z.string(),
  aviUrl: z.string(),
})

export const schema = z.object({
  colorMode: z.enum(['system', 'light', 'dark']),
  accounts: z.array(accountSchema),
  currentAccount: accountSchema.optional(),
  lastEmailConfirmReminder: z.string().optional(),

  // preferences
  primaryLanguage: z.string(), // should move to server
  contentLanguages: z.array(z.string()), // should move to server
  postLanguage: z.string(), // should move to server
  postLanguageHistory: z.array(z.string()),
  requireAltTextEnabled: z.boolean(), // should move to server
  mutedThreads: z.array(z.string()), // should move to server

  // should move to server?
  invitedUsers: z.object({
    seenDids: z.array(z.string()),
    copiedInvites: z.array(z.string()),
  }),

  onboarding: z.object({
    step: z.string(),
  }),
})
export type Schema = z.infer<typeof schema>

export const defaults: Schema = {
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
