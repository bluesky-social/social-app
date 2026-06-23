import type * as AgeRange from 'expo-age-range'
import {
  type AppBskyAgeassuranceDefs,
  type computeAgeAssuranceRegionAccess,
} from '@atproto/api'

import {logger} from '#/ageAssurance/logger'

/**
 * The ways a user can satisfy age assurance within a given region.
 *
 * - `kws`: the third-party (KWS) verification flow.
 * - `device`: native on-device age APIs (Apple Declared Age Range / Google
 *   Play Age Signals), surfaced via `expo-age-range`.
 *
 * NOTE: this is not yet part of the `app.bsky.ageassurance` lexicon. It's
 * modeled client-side (see {@link AgeAssuranceConfigRegion}) while we prototype
 * the shape. Once the lexicon adds `verificationMethods`, this can be removed in
 * favor of the generated type.
 */
export type AgeAssuranceVerificationMethod = 'device' | 'kws'

/**
 * A region config extended with the (not-yet-in-lexicon) `verificationMethods`
 * field. Regions without the field are treated as KWS-only.
 */
export type AgeAssuranceConfigRegion = AppBskyAgeassuranceDefs.ConfigRegion & {
  verificationMethods?: AgeAssuranceVerificationMethod[]
}

/**
 * Native on-device age signals, keyed by the region (a `country[-region]`
 * string, see `createRegionKey`) they were captured in. We keep one entry per
 * region so multiple regions with differing criteria can each retain their own
 * grant.
 *
 * Device assurance can't be verified server-side (the OS gives us no signed
 * attestation, only age bounds), so we persist it client-side only and bind it
 * to its capture region via the key. A grant captured in TX is only ever read
 * back for TX — it can't silently unlock another region. See
 * `getAgeAssuranceDataFromDeviceSignals`.
 */
export type AgeAssuranceDeviceSignals = {
  [regionKey: string]: AgeRange.AgeRangeResponse
}

export enum AgeAssuranceAccess {
  Unknown = 'unknown',
  None = 'none',
  Safe = 'safe',
  Full = 'full',
}

export enum AgeAssuranceStatus {
  Unknown = 'unknown',
  Pending = 'pending',
  Assured = 'assured',
  Blocked = 'blocked',
}

export type AgeAssuranceMetadata = Parameters<
  typeof computeAgeAssuranceRegionAccess
>[1] & {
  birthdate: string | undefined
}

export type AgeAssuranceState = {
  lastInitiatedAt?: string
  status: AgeAssuranceStatus
  access: AgeAssuranceAccess
  error?: 'config' // maybe other specific cases in the future
}

export type AgeAssuranceFlags = {
  isAgeRestricted: boolean
  adultContentDisabled: boolean
  chatDisabled: boolean
  groupChatDisabled: boolean
  isDeclaredUnderAdultAge: boolean
  isOverRegionMinAccessAge: boolean
  isOverAppMinAccessAge: boolean
}

export function parseStatusFromString(raw: string) {
  switch (raw) {
    case 'unknown':
      return AgeAssuranceStatus.Unknown
    case 'pending':
      return AgeAssuranceStatus.Pending
    case 'assured':
      return AgeAssuranceStatus.Assured
    case 'blocked':
      return AgeAssuranceStatus.Blocked
    default:
      logger.error(`parseStatusFromString: unknown status value: ${raw}`)
      return AgeAssuranceStatus.Unknown
  }
}

export function parseAccessFromString(raw: string) {
  switch (raw) {
    case 'unknown':
      return AgeAssuranceAccess.Unknown
    case 'none':
      return AgeAssuranceAccess.None
    case 'safe':
      return AgeAssuranceAccess.Safe
    case 'full':
      return AgeAssuranceAccess.Full
    default:
      logger.error(`parseAccessFromString: unknown access value: ${raw}`)
      return AgeAssuranceAccess.Full
  }
}
