import {type SessionAccount} from './types'

/** Maximum failed token generations considered during one expiry rescue. */
export const MAX_EXPIRY_RESCUE_GENERATIONS = 5

/** Pick the first unfailed token generation newer than the one that expired. */
export function pickExpiryRescueCandidate({
  dyingRefreshJwt,
  candidates,
  failedRefreshJwts,
}: {
  dyingRefreshJwt: string
  candidates: (SessionAccount | undefined)[]
  failedRefreshJwts: ReadonlySet<string>
}): SessionAccount | undefined {
  if (failedRefreshJwts.size >= MAX_EXPIRY_RESCUE_GENERATIONS) {
    return undefined
  }
  for (const candidate of candidates) {
    const refreshJwt = candidate?.refreshJwt
    if (
      refreshJwt &&
      refreshJwt !== dyingRefreshJwt &&
      !failedRefreshJwts.has(refreshJwt)
    ) {
      return candidate
    }
  }
  return undefined
}
