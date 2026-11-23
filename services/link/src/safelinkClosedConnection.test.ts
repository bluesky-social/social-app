import assert from 'node:assert'
import {afterEach, describe, it} from 'node:test'

import {isClosedConnection, OzoneAgent} from './cache/safelinkClient.js'

const withCause = <E extends Error>(err: E, cause: unknown): E =>
  Object.assign(err, {cause})

// What undici throws for a request sent on a connection the server had closed.
const closedConnection = () => {
  const socketError = Object.assign(new Error('other side closed'), {
    name: 'SocketError',
    code: 'UND_ERR_SOCKET',
  })
  return withCause(new TypeError('fetch failed'), socketError)
}

void describe('isClosedConnection', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  void it('finds the socket error in the cause chain', () => {
    assert.strictEqual(isClosedConnection(closedConnection()), true)
    assert.strictEqual(
      isClosedConnection(withCause(new Error('wrapped'), closedConnection())),
      true,
    )
  })

  void it('ignores other failures', () => {
    assert.strictEqual(isClosedConnection(new TypeError('fetch failed')), false)
    assert.strictEqual(
      isClosedConnection(
        withCause(
          new TypeError('fetch failed'),
          Object.assign(new Error('timeout'), {
            code: 'UND_ERR_CONNECT_TIMEOUT',
          }),
        ),
      ),
      false,
    )
    assert.strictEqual(isClosedConnection('other side closed'), false)
    assert.strictEqual(isClosedConnection(undefined), false)
  })

  void it('recognises the error an agent call rejects with', async () => {
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input, init)
      if (req.url.endsWith('com.atproto.server.createSession')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              did: 'did:plc:safelink',
              handle: 'safelink.test',
              accessJwt: 'access',
              refreshJwt: 'refresh',
            }),
            {status: 200, headers: {'content-type': 'application/json'}},
          ),
        )
      }
      return Promise.reject(closedConnection())
    }

    const agent = await new OzoneAgent(
      'https://pds.test',
      'safelink.test',
      'password',
    ).getAgent()

    await assert.rejects(
      agent.tools.ozone.safelink.queryEvents({limit: 1}),
      (err: unknown) => isClosedConnection(err),
    )
  })
})
