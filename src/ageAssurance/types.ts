import {logger} from '#/ageAssurance/logger'

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

export type AgeAssuranceState = {
  lastInitiatedAt?: string
  status: AgeAssuranceStatus
  access: AgeAssuranceAccess
  error?: 'config' // maybe other specific cases in the future
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
