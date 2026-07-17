import {Client} from '@atproto/lex'
import {PasswordSession} from '@atproto/lex-password-session'
import {api} from '@bsky.app/sdk'
import {describe, expect, it, jest} from '@jest/globals'

/*
 * clients.ts imports session-core (for networkAwareFetch), which pulls the
 * factory dependency graph. Mock the heavy leaves so this test does not load
 * the native module chain (same approach as session-core-test.ts).
 */
jest.mock('#/state/events', () => ({
  emitNetworkConfirmed: jest.fn(),
  emitNetworkLost: jest.fn(),
}))
jest.mock('#/state/birthdate')
jest.mock('#/ageAssurance/data')
jest.mock('#/ageAssurance/state', () => ({
  unsafeGetAndComputeAgeAssurance: () => ({state: {}, flags: {}}),
}))
jest.mock('#/state/queries/messages/restrictChatSettings', () => ({
  restrictChatSettings: () => Promise.resolve(),
}))
jest.mock('jwt-decode', () => ({
  jwtDecode() {
    return {scope: 'com.atproto.access'}
  },
}))

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {app, chat} from '#/lexicons'
import {
  buildAccountClient,
  buildAppviewClient,
  buildChatClient,
  getPublicLexClient,
  getUnauthenticatedClient,
  NotAuthenticatedError,
} from '../clients'
import {sessionAccountToSessionData} from '../session-core'
import {type SessionAccount} from '../types'

const DID = 'did:plc:example123'
const HANDLE = 'alice.test'
const SERVICE = 'https://bsky.social'
const APPVIEW_PROXY = 'did:web:api.bsky.app#bsky_appview'
const CHAT_PROXY = 'did:web:api.bsky.chat#bsky_chat'
const CUSTOM_LABELER = 'did:plc:custom-labeler'

function makeAccount(overrides: Partial<SessionAccount> = {}): SessionAccount {
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
 * Capture the request that a client emits. Records the last-seen URL + headers
 * and returns an empty 200 JSON body (the assertions here are about request
 * headers, not response parsing).
 */
function isRequest(input: URL | string | Request): input is Request {
  return (
    typeof input === 'object' &&
    'headers' in input &&
    input.headers instanceof Headers
  )
}

function makeCapturingFetch() {
  const seen: {url: string; headers: Headers}[] = []
  const fetchMock = jest.fn(
    (
      input: URL | string | Request,
      init: RequestInit = {},
    ): Promise<Response> => {
      /*
       * The lex Client calls fetch as (url, {headers}); the old AtpAgent
       * (XrpcClient) calls it with a single Request object carrying the
       * headers. Read headers from whichever the caller used.
       */
      const url = isRequest(input)
        ? input.url
        : input instanceof URL
          ? input.href
          : input
      const headers = isRequest(input)
        ? input.headers
        : new Headers(init.headers)
      seen.push({url, headers})
      return Promise.resolve(
        new Response(JSON.stringify({did: DID, handle: HANDLE}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      )
    },
  )
  return {seen, fetchMock}
}

/** Cast a jest fetch mock to the `fetch` type PasswordSession options expect. */
function asFetch(mock: ReturnType<typeof makeCapturingFetch>['fetchMock']) {
  return mock as unknown as typeof fetch
}

function makeSession(
  fetchMock: ReturnType<typeof makeCapturingFetch>['fetchMock'],
) {
  return new PasswordSession(sessionAccountToSessionData(makeAccount()), {
    fetch: asFetch(fetchMock),
  })
}

describe('buildAppviewClient', () => {
  it('sets the appview atproto-proxy header and includes the moderation DID in labelers', async () => {
    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildAppviewClient(session, [CUSTOM_LABELER])

    await client.call(app.bsky.actor.getProfile.main, {actor: HANDLE})

    expect(seen.length).toBe(1)
    expect(seen[0].headers.get('atproto-proxy')).toBe(APPVIEW_PROXY)
    const labelers = seen[0].headers.get('atproto-accept-labelers') ?? ''
    expect(labelers).toContain(api.moderation.did)
    expect(labelers).toContain(CUSTOM_LABELER)
  })

  it('routes through the session fetchHandler with the bearer token', async () => {
    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildAppviewClient(session, [])

    await client.call(app.bsky.actor.getProfile.main, {actor: HANDLE})

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(seen[0].headers.get('authorization')).toBe('Bearer access-jwt')
    /* the moderation DID is always re-asserted even with no custom labelers */
    expect(seen[0].headers.get('atproto-accept-labelers')).toContain(
      api.moderation.did,
    )
  })
})

describe('buildAccountClient', () => {
  it('has no atproto-proxy header (requests hit the PDS directly)', async () => {
    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildAccountClient(session)

    await client.call(app.bsky.actor.getProfile.main, {actor: HANDLE})

    expect(seen.length).toBe(1)
    expect(seen[0].headers.get('atproto-proxy')).toBeNull()
  })

  it('routes through the session fetchHandler with the bearer token', async () => {
    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildAccountClient(session)

    await client.call(app.bsky.actor.getProfile.main, {actor: HANDLE})

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(seen[0].headers.get('authorization')).toBe('Bearer access-jwt')
  })
})

describe('buildChatClient', () => {
  it('sets the chat atproto-proxy header on a request', async () => {
    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildChatClient(session)

    await client.call(chat.bsky.convo.listConvos.main).catch(() => {})

    expect(seen.length).toBe(1)
    expect(seen[0].headers.get('atproto-proxy')).toBe(CHAT_PROXY)
  })

  it('routes through the session fetchHandler with the bearer token', async () => {
    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildChatClient(session)

    await client.call(chat.bsky.convo.listConvos.main).catch(() => {})

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(seen[0].headers.get('authorization')).toBe('Bearer access-jwt')
  })
})

describe('getUnauthenticatedClient', () => {
  it('is a stable singleton with no did', () => {
    const client = getUnauthenticatedClient()
    expect(client.did).toBeUndefined()
    /* identity is stable so it is safe in React Query keys */
    expect(getUnauthenticatedClient()).toBe(client)
  })

  it('rejects on a call, with NotAuthenticatedError as the root cause', async () => {
    /*
     * The throwing fetchHandler fires before any network I/O. lex-client wraps
     * a fetchHandler throw in an XrpcInternalError whose `.cause` is the
     * original error, so the NotAuthenticatedError surfaces as the cause.
     */
    const client = getUnauthenticatedClient()

    const err = await client
      .call(chat.bsky.convo.listConvos.main)
      .then(() => undefined)
      .catch((e: unknown) => e)

    expect(err).toBeInstanceOf(Error)
    expect((err as Error).cause).toBeInstanceOf(NotAuthenticatedError)
  })

  it('surfaces a NotAuthenticatedError with a stable name and message', async () => {
    const client = getUnauthenticatedClient()

    const err = await client
      .call(chat.bsky.convo.listConvos.main)
      .then(() => undefined)
      .catch((e: unknown) => e)

    const cause = (err as Error).cause
    expect(cause).toBeInstanceOf(NotAuthenticatedError)
    expect((cause as NotAuthenticatedError).name).toBe('NotAuthenticatedError')
    expect((cause as NotAuthenticatedError).message).toBe(
      'Not authenticated: this operation requires an active session',
    )
  })
})

describe('getPublicLexClient', () => {
  it('is an unauthenticated singleton (no session did)', () => {
    const client = getPublicLexClient()
    expect(client.did).toBeUndefined()
    /* process-wide singleton: identity is stable across calls */
    expect(getPublicLexClient()).toBe(client)
  })

  it('routes to public.api.bsky.app with no proxy or auth header', async () => {
    /*
     * getPublicLexClient builds `new Client({service: PUBLIC_BSKY_SERVICE,
     * fetch: networkAwareFetch})`. networkAwareFetch captures the global fetch
     * at import time, which is hard to intercept here, so we reconstruct the
     * same Client shape with an observable fetch to assert the routing +
     * header contract the source relies on. The response body fails getProfile
     * validation (it is a stub), but request headers are recorded pre-parse.
     */
    const {seen, fetchMock} = makeCapturingFetch()
    const client = new Client({
      service: PUBLIC_BSKY_SERVICE,
      fetch: asFetch(fetchMock),
    })
    await client
      .call(app.bsky.actor.getProfile.main, {actor: HANDLE})
      .catch(() => {})

    expect(seen.length).toBe(1)
    expect(seen[0].url).toContain('public.api.bsky.app')
    expect(seen[0].headers.get('atproto-proxy')).toBeNull()
    expect(seen[0].headers.get('authorization')).toBeNull()
  })
})

/*
 * Regression guard: the emitted `atproto-accept-labelers` header from a
 * fully-configured appview client must carry the exact byte-shape the old
 * AtpAgent produced - global appLabelers carry the `;redact` suffix, per
 * -instance labelers are plain. The old AtpAgent reference implementation is
 * gone with the bridge, so we assert the composition invariant directly (design
 * section 6).
 */
describe('labeler-header regression guard', () => {
  it('appview client emits the global Bluesky labeler redacted and the per-instance labeler plain', async () => {
    /*
     * buildAppviewClient re-asserts api.moderation.did as a base labeler; the
     * global Client.appLabelers carry the `;redact` suffix. Configure the global
     * appLabelers to the Bluesky moderation DID (matching switchToBskyAppLabeler
     * in moderation.ts) so the composition matches production.
     */
    Client.configure({appLabelers: [api.moderation.did]})

    const {seen, fetchMock} = makeCapturingFetch()
    const session = makeSession(fetchMock)
    const client = buildAppviewClient(session, [CUSTOM_LABELER])
    await client
      .call(app.bsky.actor.getProfile.main, {actor: HANDLE})
      .catch(() => {})
    const header = seen[0].headers.get('atproto-accept-labelers')

    /* the global Bluesky moderation labeler is redacted */
    expect(header).toContain(`${api.moderation.did};redact`)
    /* the per-instance custom labeler is present and plain (no redact) */
    expect(header).toContain(CUSTOM_LABELER)
    expect(header).not.toContain(`${CUSTOM_LABELER};redact`)
  })
})
