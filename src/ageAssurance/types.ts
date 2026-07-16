import type * as AgeRange from 'expo-age-range'
import {type computeAgeAssuranceRegionAccess} from '@bsky.app/sdk/utils'

import {logger} from '#/ageAssurance/logger'

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
  hasDeclaredAge: boolean
  isDeclaredUnderAdultAge: boolean
  isOverRegionMinAccessAge: boolean
  isOverAppMinAccessAge: boolean
  allowsDeviceVerification: boolean
  hasSharedDeviceSignals: boolean
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
