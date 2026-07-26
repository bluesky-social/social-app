import {z} from 'zod'

/**
 * The durable, serializable portion of an account session.
 *
 * Keep this schema independent from the global persisted-state schema: session
 * storage owns it, while the old persisted field imports it only for migration.
 */
export const sessionAccountSchema = z.object({
  service: z.string(),
  did: z.string(),
  handle: z.string(),
  email: z.string().optional(),
  emailConfirmed: z.boolean().optional(),
  emailAuthFactor: z.boolean().optional(),
  refreshJwt: z.string().optional(),
  accessJwt: z.string().optional(),
  signupQueued: z.boolean().optional(),
  active: z.boolean().optional(),
  status: z.string().optional(),
  pdsUrl: z.string().optional(),
  isSelfHosted: z.boolean().optional(),
})

export type SessionAccount = z.infer<typeof sessionAccountSchema>

export const sessionSnapshotSchema = z.object({
  accounts: z.array(sessionAccountSchema),
  currentDid: z.string().optional(),
})

export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>
