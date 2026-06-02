import {AtpAgent, XRPCError} from '@atproto/api'

import {BSKY_SERVICE, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {isNetworkError} from '#/lib/strings/errors'

export function isHandleResolutionError(e: unknown): boolean {
  if (e && typeof e === 'object' && 'name' in e) {
    const name = (e as {name?: unknown}).name
    if (name === 'IdentityResolverError' || name === 'HandleResolverError') {
      return true
    }
  }
  const s = String(e)
  return (
    s.includes('Unable to resolve handle') ||
    s.includes('does not resolve to a DID') ||
    s.includes('Failed to resolve identity')
  )
}

export async function resolveDeactivatedHandle(
  identifier: string,
): Promise<string> {
  if (identifier.startsWith('did:')) {
    return identifier
  }
  const appview = new AtpAgent({service: PUBLIC_BSKY_SERVICE})
  let did: string
  try {
    const res = await appview.com.atproto.identity.resolveHandle({
      handle: identifier,
    })
    did = res.data.did
  } catch (e) {
    if (isNetworkError(e)) throw e
    throw new Error('Unable to resolve handle')
  }

  const pds = new AtpAgent({service: BSKY_SERVICE})
  let active: boolean | undefined
  let status: string | undefined
  try {
    const res = await pds.com.atproto.sync.getRepoStatus({did})
    active = res.data.active
    status = res.data.status
  } catch (e) {
    if (e instanceof XRPCError && e.status === 404) {
      return did
    }
    if (isNetworkError(e)) throw e
    throw new Error('Unable to verify account status')
  }
  if (active || status === 'deactivated') {
    return did
  }
  if (status === 'takendown') {
    throw new Error('Account has been taken down')
  }
  if (status === 'suspended') {
    throw new Error('Account has been suspended')
  }
  throw new Error('Unable to verify account status')
}
