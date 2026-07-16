import {type AtpAgent} from '@atproto/api'
import {Client} from '@atproto/lex-client'
import {describe, expect, it, jest} from '@jest/globals'

import {app} from '#/lexicons'

/*
 * clients.ts now imports session-core (for networkAwareFetch), which pulls the
 * factory dependency graph. Mock the heavy leaves so this test does not load
 * the native module chain (same approach as session-test.ts).
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

import {agentToLexClient} from '../clients'

/**
 * Minimal stand-in for the parts of AtpAgent that `agentToLexClient` reads: a
 * `did` and a `fetchHandler`. Returned as `AtpAgent` via a cast since we only
 * exercise those two members.
 */
function makeFakeAgent(did: string | undefined) {
  const fetchHandler = jest.fn(
    (_path: string, _init: RequestInit): Promise<Response> =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            did: 'did:plc:fake',
            handle: 'fake.bsky.social',
          }),
          {status: 200, headers: {'content-type': 'application/json'}},
        ),
      ),
  )
  const agent = {did, fetchHandler}
  return {agent: agent as unknown as AtpAgent, fetchHandler}
}

describe('agentToLexClient', () => {
  it('routes client.call through the agent fetchHandler', async () => {
    const {agent, fetchHandler} = makeFakeAgent('did:plc:fake')
    const client = agentToLexClient(agent)

    const result = await client.call(app.bsky.actor.getProfile.main, {
      actor: 'fake.bsky.social',
    })

    expect(fetchHandler).toHaveBeenCalledTimes(1)
    const [path] = fetchHandler.mock.calls[0]
    expect(path).toContain('/xrpc/app.bsky.actor.getProfile')
    expect(path).toContain('actor=fake.bsky.social')
    expect(result.handle).toBe('fake.bsky.social')
  })

  it('passes through the agent did', () => {
    const {agent} = makeFakeAgent('did:plc:fake')
    const client = agentToLexClient(agent)
    expect(client.did).toBe('did:plc:fake')
  })

  it('reflects an undefined did (unauthenticated agent)', () => {
    const {agent} = makeFakeAgent(undefined)
    const client = agentToLexClient(agent)
    expect(client.did).toBeUndefined()
  })

  it('memoizes one client per agent', () => {
    const {agent: agentA} = makeFakeAgent('did:plc:a')
    const {agent: agentB} = makeFakeAgent('did:plc:b')

    const clientA1 = agentToLexClient(agentA)
    const clientA2 = agentToLexClient(agentA)
    const clientB = agentToLexClient(agentB)

    expect(clientA1).toBeInstanceOf(Client)
    expect(clientA1).toBe(clientA2)
    expect(clientA1).not.toBe(clientB)
  })
})
