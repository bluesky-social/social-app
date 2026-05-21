/**
 * Resolve a user's PDS service endpoint from their handle/DID.
 *
 * Eurosky fork: the password sign-in flow deliberately has no hosting-
 * provider picker (most users are on the Bluesky PDS or Eurosky's own PDS).
 * `com.atproto.server.createSession` must hit the account's actual PDS, so
 * we resolve it: handle -> DID (appview resolveHandle) -> DID doc
 * (plc.directory for did:plc, /.well-known/did.json for did:web) ->
 * `#atproto_pds` serviceEndpoint.
 *
 * Self-contained (only `@atproto/api` + fetch); no extra deps.
 */
import {AtpAgent} from '@atproto/api'

import {BSKY_SERVICE, PUBLIC_BSKY_SERVICE} from '#/lib/constants'

type DidDoc = {
  service?: {id: string; type: string; serviceEndpoint: string}[]
}

function pdsFromDidDoc(doc: DidDoc): string | undefined {
  const svc = doc.service?.find(
    s =>
      s.id === '#atproto_pds' ||
      s.id.endsWith('#atproto_pds') ||
      s.type === 'AtprotoPersonalDataServer',
  )
  return svc?.serviceEndpoint
}

async function fetchDidDoc(did: string): Promise<DidDoc> {
  if (did.startsWith('did:plc:')) {
    const res = await fetch(`https://plc.directory/${did}`)
    if (!res.ok) throw new Error(`plc.directory ${res.status} for ${did}`)
    return (await res.json()) as DidDoc
  }
  if (did.startsWith('did:web:')) {
    // did:web:example.com  ->  https://example.com/.well-known/did.json
    // did:web:example.com:path -> https://example.com/path/did.json
    const rest = did.slice('did:web:'.length)
    const [host, ...segs] = rest.split(':')
    const base = `https://${decodeURIComponent(host)}`
    const url = segs.length
      ? `${base}/${segs.map(decodeURIComponent).join('/')}/did.json`
      : `${base}/.well-known/did.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`did:web ${res.status} for ${did}`)
    return (await res.json()) as DidDoc
  }
  throw new Error(`Unsupported DID method: ${did}`)
}

/**
 * Returns the PDS base URL to pass as `service` to session.login().
 *
 * Email identifiers can't be resolved to a PDS (no handle), so they fall
 * back to the Bluesky entryway - acceptable since email login is rare and
 * only meaningful for Bluesky-hosted accounts anyway.
 */
export async function resolvePdsFromIdentifier(
  identifier: string,
): Promise<string> {
  const id = identifier.trim().replace(/^@/, '').toLowerCase()

  if (id.includes('@')) {
    // looks like an email - can't resolve, use the entryway
    return BSKY_SERVICE
  }

  let did = id
  if (!id.startsWith('did:')) {
    const agent = new AtpAgent({service: PUBLIC_BSKY_SERVICE})
    const res = await agent.com.atproto.identity.resolveHandle({handle: id})
    did = res.data.did
  }

  const doc = await fetchDidDoc(did)
  const pds = pdsFromDidDoc(doc)
  if (!pds) {
    throw new Error(`No atproto PDS endpoint in DID document for ${did}`)
  }
  return pds
}
