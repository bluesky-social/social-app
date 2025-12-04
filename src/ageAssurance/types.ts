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
}

export function parseStatusFromString(raw: string) {
  let status = AgeAssuranceStatus.Unknown
  switch (raw) {
    case 'unknown':
      status = AgeAssuranceStatus.Unknown
      break
    case 'pending':
      status = AgeAssuranceStatus.Pending
      break
    case 'assured':
      status = AgeAssuranceStatus.Assured
      break
    case 'blocked':
      status = AgeAssuranceStatus.Blocked
      break
    default:
      logger.error(`parseStatusFromString: unknown status value: ${raw}`)
      status = AgeAssuranceStatus.Unknown
  }
  return status
}

export function parseAccessFromString(raw: string) {
  switch (raw) {
    case 'unknown':
      return AgeAssuranceAccess.Unknown
      break
    case 'none':
      return AgeAssuranceAccess.None
      break
    case 'safe':
      return AgeAssuranceAccess.Safe
      break
    case 'full':
      return AgeAssuranceAccess.Full
      break
    default:
      logger.error(`parseAccessFromString: unknown access value: ${raw}`)
      return AgeAssuranceAccess.Full
  }
}
