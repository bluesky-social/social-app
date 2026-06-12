/**
 * Eurosky fork: custom OAuth identity resolver.
 *
 * The stock @atproto/oauth-client resolves a DID document by fetching it
 * directly from the browser. For did:web that means GETting
 * `https://<domain>/.well-known/did.json` cross-origin - and most did:web
 * hosts (and PDSes like Tranquil) don't send `Access-Control-Allow-Origin`,
 * so the browser blocks the request and sign-in fails (surfacing as the
 * misleading "unable to resolve handle"). did:plc is unaffected because
 * plc.directory serves permissive CORS.
 *
 * This resolver fixes did:web by falling back to the server-side
 * `com.atproto.identity.resolveDid` XRPC (no CORS) when the direct fetch
 * fails, and hardens handle resolution with DoH + .well-known fallbacks so
 * custom-domain handles that the AppView can't resolve still work. It is
 * wired into both web OAuth client paths via the `identityResolver` option
 * (supported by the base OAuthClient).
 *
 * Self-contained: only `@atproto/api` + fetch + the fork's createPublicAgent.
 */
import {type ComAtprotoIdentityDefs, isDid} from '@atproto/api'
import {
  type IdentityInfo,
  type IdentityResolver,
} from '@atproto-labs/identity-resolver'

import {getDidDocumentUrl} from '#/lib/atproto/did'
import {createPublicAgent} from './agent'

// did:plc documents are fetched from the PLC directory (CORS-friendly). The
// fork has no custom-PLC-directory preference, so this is the canonical one.
const PLC_DIRECTORY_URL = 'https://plc.directory'
// DNS-over-HTTPS endpoint for client-side `_atproto.<handle>` TXT lookups
// (browsers can't do raw DNS). Cloudflare's resolver supports CORS.
const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query'

type AtprotoDid = `did:plc:${string}` | `did:web:${string}`
type DidDocument = {
  id?: string
  alsoKnownAs?: string[]
  service?: Service[]
}

type Service = {
  id?: string
  type?: string
  serviceEndpoint?: string
}

const HANDLE_INVALID = 'handle.invalid'

function asNormalizedHandle(input: string) {
  const handle = input.toLowerCase()
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/.test(
    handle,
  )
    ? handle
    : undefined
}

function extractNormalizedHandle(document: DidDocument) {
  if (!Array.isArray(document.alsoKnownAs)) return

  for (const value of document.alsoKnownAs) {
    if (value.startsWith('at://')) {
      return asNormalizedHandle(value.slice(5))
    }
  }
}

function findService(doc: DidDocument, id: string, type?: string) {
  if (!Array.isArray(doc?.service)) return
  return doc.service.find(
    service =>
      service?.serviceEndpoint &&
      service?.id === id &&
      (!type || service?.type === type),
  )
}

async function resolveHandleUsingAppView(
  handle: string,
  signal?: AbortSignal,
): Promise<AtprotoDid> {
  const agent = createPublicAgent()

  try {
    const res = await agent.resolveHandle({handle}, {signal})
    return res.data.did as AtprotoDid
  } finally {
    agent.dispose()
  }
}

async function resolveHandleUsingDoh(
  handle: string,
  signal?: AbortSignal,
): Promise<AtprotoDid | null> {
  const url = new URL(DOH_ENDPOINT)
  url.searchParams.set('type', 'TXT')
  url.searchParams.set('name', `_atproto.${handle}`)

  const response = await fetch(url, {
    headers: {
      accept: 'application/dns-json',
    },
    redirect: 'follow',
    signal,
  })

  if (!response.ok) {
    return null
  }

  const result = (await response.json()) as {
    Answer?: Array<{type?: number; data?: string}>
  }
  const txtRecords =
    result.Answer?.filter(
      answer => answer.type === 16 && typeof answer.data === 'string',
    ).map(answer => answer.data!.replace(/^"|"$/g, '').replace(/\\"/g, '"')) ??
    []

  let did: AtprotoDid | null = null
  for (const record of txtRecords) {
    if (!record.startsWith('did=')) continue

    const nextDid = record.slice(4)
    if (!isDid(nextDid)) {
      return null
    }

    if (did && did !== nextDid) {
      return null
    }

    did = nextDid as AtprotoDid
  }

  return did
}

async function resolveHandleUsingWellKnown(
  handle: string,
  signal?: AbortSignal,
): Promise<AtprotoDid | null> {
  try {
    const response = await fetch(`https://${handle}/.well-known/atproto-did`, {
      redirect: 'error',
      signal,
    })
    const text = await response.text()
    const firstLine = text.split('\n')[0]?.trim()
    return firstLine && isDid(firstLine) ? (firstLine as AtprotoDid) : null
  } catch {
    signal?.throwIfAborted()
    return null
  }
}

async function resolveHandleClientSide(
  handle: string,
  signal?: AbortSignal,
): Promise<AtprotoDid | null> {
  try {
    const did = await resolveHandleUsingDoh(handle, signal)
    if (did) return did
  } catch {
    signal?.throwIfAborted()
  }

  return resolveHandleUsingWellKnown(handle, signal)
}

async function resolveHandle(
  handle: string,
  signal?: AbortSignal,
): Promise<AtprotoDid> {
  try {
    return await resolveHandleUsingAppView(handle, signal)
  } catch (appViewError) {
    const fallbackDid = await resolveHandleClientSide(handle, signal)
    if (fallbackDid) {
      return fallbackDid
    }

    throw appViewError
  }
}

async function resolveDidDocument(
  did: AtprotoDid,
  signal?: AbortSignal,
): Promise<DidDocument> {
  const docUrl = getDidDocumentUrl(did, PLC_DIRECTORY_URL)
  if (!docUrl) {
    throw new Error(`Unsupported DID method for ${did}`)
  }

  try {
    const res = await fetch(docUrl, {
      headers: {
        accept: 'application/did+ld+json, application/json',
      },
      signal,
    })

    if (!res.ok) {
      throw new Error(`Failed to resolve DID document for ${did}`)
    }

    return (await res.json()) as DidDocument
  } catch (err) {
    // did:web hosts frequently lack CORS headers, so a direct browser fetch
    // is blocked. Fall back to the AppView's server-side DID resolution.
    if (!did.startsWith('did:web:')) {
      throw err
    }

    const agent = createPublicAgent()
    try {
      const res = await agent.com.atproto.identity.resolveDid({did}, {signal})
      return res.data.didDoc
    } finally {
      agent.dispose()
    }
  }
}

async function getValidatedHandleFromDidDocument(
  did: AtprotoDid,
  didDoc: DidDocument,
  signal?: AbortSignal,
) {
  const handle = extractNormalizedHandle(didDoc)
  if (!handle) return HANDLE_INVALID

  try {
    const resolvedDid = await resolveHandle(handle, signal)
    return resolvedDid === did ? handle : HANDLE_INVALID
  } catch {
    return HANDLE_INVALID
  }
}

export async function resolveIdentityUsingAppView(
  identifier: string,
  signal?: AbortSignal,
): Promise<ComAtprotoIdentityDefs.IdentityInfo> {
  if (isDid(identifier)) {
    const did = identifier as AtprotoDid
    const didDoc = await resolveDidDocument(did, signal)
    const handle = await getValidatedHandleFromDidDocument(did, didDoc, signal)

    return {
      did,
      didDoc,
      handle,
    }
  }

  const handle = asNormalizedHandle(identifier)
  if (!handle) {
    throw new Error(`Invalid handle "${identifier}" provided.`)
  }

  const did = await resolveHandle(handle, signal)
  const didDoc = await resolveDidDocument(did, signal)

  return {
    did,
    didDoc,
    handle: extractNormalizedHandle(didDoc) ?? HANDLE_INVALID,
  }
}

export function createIdentityResolver(): IdentityResolver {
  return {
    async resolve(
      input: string,
      options?: {signal?: AbortSignal},
    ): Promise<IdentityInfo> {
      const identity = await resolveIdentityUsingAppView(input, options?.signal)

      return {
        did: identity.did as AtprotoDid,
        didDoc: identity.didDoc as IdentityInfo['didDoc'],
        handle: identity.handle,
      }
    },
  }
}

export function getPdsServiceUrlFromIdentityInfo(
  identity: Pick<ComAtprotoIdentityDefs.IdentityInfo, 'didDoc'>,
) {
  return findService(
    identity.didDoc,
    '#atproto_pds',
    'AtprotoPersonalDataServer',
  )?.serviceEndpoint
}
