import {jest} from '@jest/globals'

import {type SessionAccount} from '../types'

/*
 * Shared fixtures for the suites that drive a real `PasswordSession` over a
 * stubbed network. Not a suite itself - the filename deliberately avoids the
 * `-test` suffix so jest does not collect it.
 */

export const DID = 'did:plc:example123'
export const HANDLE = 'alice.test'
export const SERVICE = 'https://bsky.social'
/** A PDS host an account may be pinned to by its stored `pdsUrl`. */
export const PDS_HOST = 'https://shimeji.us-east.host.bsky.network'
/** A different PDS host, delivered by the didDoc a refresh returns. */
export const DIDDOC_PDS_HOST = 'https://morel.us-west.host.bsky.network'

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'content-type': 'application/json'},
  })
}

/** A minimal valid DID document whose only service entry is a PDS. */
export function makeDidDoc(pdsUrl: string, did: string = DID) {
  return {
    id: did,
    service: [
      {
        id: '#atproto_pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: pdsUrl,
      },
    ],
  }
}

export function makeAccount(
  overrides: Partial<SessionAccount> = {},
): SessionAccount {
  return {
    service: SERVICE,
    did: DID,
    handle: HANDLE,
    email: 'alice@example.com',
    emailConfirmed: true,
    emailAuthFactor: false,
    refreshJwt: 'refresh-jwt',
    accessJwt: 'access-jwt',
    signupQueued: false,
    active: true,
    status: undefined,
    pdsUrl: undefined,
    isSelfHosted: false,
    ...overrides,
  }
}

/**
 * Build a mock `fetch` that returns canned XRPC responses keyed by the last
 * path segment (nsid). `refreshSession` returns fresh tokens; `getSession`
 * echoes the account; anything else returns an empty 200.
 *
 * The refresh response carries both `emailConfirmed` and a `didDoc` so the
 * library has no reason to make a `getSession` follow-up call, which keeps the
 * recorded request list assertable. Its didDoc points at
 * {@link DIDDOC_PDS_HOST}, a different host from {@link PDS_HOST}, so PDS
 * re-routing after a refresh is observable.
 */
export function makeMockFetch(
  overrides: Record<
    string,
    (url: string, init: RequestInit) => Response | Promise<Response>
  > = {},
) {
  return jest.fn(
    /*
     * PasswordSession calls fetch with a URL object (new URL(path, service));
     * asFetch() below widens the mock to the full fetch signature it expects.
     */
    async (input: URL | string, init: RequestInit = {}): Promise<Response> => {
      const url = input instanceof URL ? input.href : input
      const nsid = url.split('/xrpc/')[1]?.split('?')[0]
      const handler = nsid ? overrides[nsid] : undefined
      if (handler) {
        return handler(url, init)
      }
      if (nsid === 'com.atproto.server.refreshSession') {
        return json({
          accessJwt: 'access-jwt-2',
          refreshJwt: 'refresh-jwt-2',
          handle: HANDLE,
          did: DID,
          email: 'alice@example.com',
          emailConfirmed: true,
          didDoc: makeDidDoc(DIDDOC_PDS_HOST),
          active: true,
        })
      }
      if (nsid === 'com.atproto.server.getSession') {
        return json({
          did: DID,
          handle: HANDLE,
          email: 'alice@example.com',
          emailConfirmed: true,
          active: true,
        })
      }
      return json({})
    },
  )
}

export type MockFetch = ReturnType<typeof makeMockFetch>

/** Cast a jest fetch mock to the `fetch` type PasswordSession options expect. */
export function asFetch(mock: MockFetch): typeof fetch {
  return mock as unknown as typeof fetch
}

/** The URLs a mock fetch was called with, in order. */
export function urlsOf(mock: MockFetch): string[] {
  return mock.mock.calls.map(c => (c[0] instanceof URL ? c[0].href : c[0]))
}
