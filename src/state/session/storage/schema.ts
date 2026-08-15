import {z} from 'zod'

import {accountSchema} from '#/state/persisted/schema'
import {type SessionAccount} from '#/state/session/types'

/**
 * An account minus its tokens, stored under its own key so credentials can be
 * revoked without losing the account itself.
 *
 * Derived from the persisted account schema rather than redeclared: the did
 * field is genuinely validated there, and its narrowed `DidString` output is
 * what makes a parsed descriptor assignable to {@link SessionAccount}.
 */
export const descriptorSchema = accountSchema.omit({
  accessJwt: true,
  refreshJwt: true,
})
export type AccountDescriptor = z.infer<typeof descriptorSchema>

/**
 * The commit index. Names the stored dids, the current did, and the journals
 * an interrupted write leaves behind for the next read to finish.
 *
 * The dids here are deliberately plain strings. Each account's did is validated
 * by {@link descriptorSchema} when its descriptor is read, and `readSessions`
 * cross-checks that the descriptor's did matches the did it was listed under.
 * Validating dids in the index as well would let one odd value invalidate the
 * whole store, taking every other account's credentials with it.
 */
export const storedIndexSchema = z.object({
  version: z.literal(1),
  currentDid: z.string().optional(),
  dids: z.array(z.string()),
  retiredDids: z.array(z.string()).optional(),
  revokedDids: z.array(z.string()).optional(),
})
export type StoredIndex = z.infer<typeof storedIndexSchema>

/**
 * The full session state as this module stores it: every account, plus which
 * one is current. `currentDid` must always name an account in `accounts`.
 */
export type SessionSnapshot = {
  accounts: SessionAccount[]
  currentDid: string | undefined
}

export const EMPTY_SNAPSHOT: SessionSnapshot = {
  accounts: [],
  currentDid: undefined,
}
