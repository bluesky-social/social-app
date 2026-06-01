import {AtUri} from '@atproto/api'

import {CONSTELLATION_SERVICE} from '#/lib/constants'

const VERIFICATION_COLLECTION = 'app.bsky.graph.verification'
// The JSON path, within a verification record, to the link we index on. Records
// look like `{subject: <did>, ...}`, so the link to the subject lives at `subject`.
const VERIFICATION_SUBJECT_SOURCE = `${VERIFICATION_COLLECTION}:subject`

/**
 * A single `app.bsky.graph.verification` record that points at a given subject,
 * as returned by the Constellation backlink index. This identifies the record
 * (issuer + uri) but does NOT include its body - the index stores links, not
 * record contents. Fetch the record itself if you need `createdAt`/`handle`.
 */
export type VerificationBacklink = {
  /** DID of the account that issued the verification (the record's repo). */
  issuer: string
  /** AT-URI of the verification record. */
  uri: string
}

type GetBacklinksResponse = {
  total: number
  records: {did: string; collection: string; rkey: string}[]
  cursor?: string
}

/**
 * Returns every `app.bsky.graph.verification` record across the network that
 * names `subjectDid` as its subject. This is network-wide and unfiltered:
 * callers must intersect the issuers with their trusted-verifier set to decide
 * what actually counts.
 */
export async function getVerificationBacklinks(
  subjectDid: string,
): Promise<VerificationBacklink[]> {
  const out: VerificationBacklink[] = []
  let cursor: string | undefined

  // Bound the pagination so a heavily-verified subject can't spin forever; a
  // handful of trusted verifiers means we only care about the first few anyway.
  for (let page = 0; page < 5; page++) {
    const url = new URL(
      `/xrpc/blue.microcosm.links.getBacklinks`,
      CONSTELLATION_SERVICE,
    )
    url.searchParams.set('subject', subjectDid)
    url.searchParams.set('source', VERIFICATION_SUBJECT_SOURCE)
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: {accept: 'application/json'},
    })
    if (!res.ok) {
      throw new Error(`Constellation getBacklinks failed: ${res.status}`)
    }
    const json = (await res.json()) as GetBacklinksResponse

    for (const r of json.records ?? []) {
      out.push({
        issuer: r.did,
        uri: AtUri.make(r.did, r.collection, r.rkey).toString(),
      })
    }

    if (!json.cursor || (json.records ?? []).length === 0) break
    cursor = json.cursor
  }

  return out
}
