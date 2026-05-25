import {BSKY_SERVICE} from '#/lib/constants'
import {Agent} from '#/state/session/agent'

/**
 * Resolves an atproto handle (or DID) to the user's PDS service URL.
 *
 * Flow:
 *   handle -> DID  (via {resolverUrl}'s `com.atproto.identity.resolveHandle`)
 *   DID    -> DID doc  (via plc.directory or did:web `.well-known/did.json`)
 *   DID doc -> PDS  (`serviceEndpoint` of the `#atproto_pds` service entry)
 *
 * Throws `ResolvePdsError` with a `reason` discriminator on failure.
 */
export async function resolvePdsForHandle(
  handleOrDid: string,
  opts: {resolverUrl?: string} = {},
): Promise<{pds: string; did: string}> {
  const input = handleOrDid.trim().replace(/^@/, '').toLowerCase()
  if (!input) {
    throw new ResolvePdsError('invalid_handle', 'Empty handle')
  }

  const did = input.startsWith('did:')
    ? input
    : await resolveHandleToDid(input, opts.resolverUrl ?? BSKY_SERVICE)

  const doc = await fetchDidDoc(did)
  const pds = getPdsFromDidDoc(doc)
  if (!pds) {
    throw new ResolvePdsError(
      'no_pds_in_doc',
      `No #atproto_pds service in DID doc for ${did}`,
    )
  }
  return {pds, did}
}

async function resolveHandleToDid(
  handle: string,
  resolverUrl: string,
): Promise<string> {
  try {
    const agent = new Agent(null, {service: resolverUrl})
    const res = await agent.resolveHandle({handle})
    return res.data.did
  } catch (e) {
    throw new ResolvePdsError(
      'handle_not_found',
      `Could not resolve handle ${handle}`,
      e,
    )
  }
}

async function fetchDidDoc(did: string): Promise<DidDoc> {
  let url: string
  if (did.startsWith('did:plc:')) {
    url = `https://plc.directory/${did}`
  } else if (did.startsWith('did:web:')) {
    const domain = did.slice('did:web:'.length)
    url = `https://${domain}/.well-known/did.json`
  } else {
    throw new ResolvePdsError(
      'did_doc_failed',
      `Unsupported DID method: ${did}`,
    )
  }
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return (await res.json()) as DidDoc
  } catch (e) {
    throw new ResolvePdsError(
      'did_doc_failed',
      `Failed to fetch DID doc from ${url}`,
      e,
    )
  }
}

function getPdsFromDidDoc(doc: DidDoc): string | undefined {
  const service = doc.service?.find(s => s.id?.endsWith('#atproto_pds'))
  const endpoint = service?.serviceEndpoint
  if (typeof endpoint === 'string') {
    return endpoint
  }
  return undefined
}

type DidDoc = {
  service?: {id?: string; type?: string; serviceEndpoint?: unknown}[]
}

/**
 * Returns true when the given PDS URL is one of Bluesky's hosted PDSes
 * (either the marketing host or one of the sharded backend hosts). Used to
 * decide when the auto-resolved server hint is too obvious to be worth
 * showing to the user.
 */
export function isBlueskyHostedPds(pdsUrl: string): boolean {
  if (pdsUrl === BSKY_SERVICE) return true
  try {
    const {hostname} = new URL(pdsUrl)
    return hostname === 'bsky.social' || hostname.endsWith('.host.bsky.network')
  } catch {
    return false
  }
}

export type ResolvePdsErrorReason =
  | 'invalid_handle'
  | 'handle_not_found'
  | 'did_doc_failed'
  | 'no_pds_in_doc'

export class ResolvePdsError extends Error {
  reason: ResolvePdsErrorReason
  cause?: unknown
  constructor(reason: ResolvePdsErrorReason, message: string, cause?: unknown) {
    super(message)
    this.name = 'ResolvePdsError'
    this.reason = reason
    this.cause = cause
  }
}
