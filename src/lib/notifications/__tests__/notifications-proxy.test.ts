import {Client} from '@atproto/lex-client'
import {describe, expect, it} from '@jest/globals'

import {NOTIF_SERVICE} from '#/lib/constants'
import {app} from '#/lexicons'

/*
 * Proxy-emission guard for the push-notification register/unregister calls.
 *
 * registerPush/unregisterPush move from an explicit `atproto-proxy` header on
 * the old bridge agent to a per-call `service` option on the lex account
 * client (see notifications.ts). This test proves the notif service DID
 * actually reaches the wire as the `atproto-proxy` header when that option is
 * used, so a wrong proxy target cannot fail silently (design Risk #2).
 *
 * The technique mirrors clients-bundle-test.ts: build a Client over a fake
 * `fetchHandler` agent (no session/native chain), issue a real `Client.call`
 * with the same per-call `service: NOTIF_SERVICE` option the notification
 * calls use, and assert the emitted request header. Procedure request bodies
 * cannot be encoded under the jest CID interop, so the call uses a query - the
 * `service` -> `atproto-proxy` header path is shared by queries and procedures
 * alike, so this faithfully exercises what registerPush/unregisterPush emit.
 */

const DID = 'did:plc:example123'
const HANDLE = 'alice.test'
const SERVICE_ORIGIN = 'https://bsky.social'

function makeCapturingClient() {
  const seen: {path: string; headers: Headers}[] = []
  const client = new Client({
    did: DID,
    fetchHandler: (path, init) => {
      seen.push({path, headers: new Headers(init.headers)})
      return Promise.resolve(
        new Response(JSON.stringify({did: DID, handle: HANDLE}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      )
    },
  })
  return {seen, client}
}

describe('notifications proxy emission', () => {
  it('NOTIF_SERVICE targets the notif service fragment', () => {
    /* the constant is the single source of the proxy DID reaching the wire */
    expect(NOTIF_SERVICE).toMatch(/#bsky_notif$/)
  })

  it('emits atproto-proxy: <NOTIF_SERVICE> when the per-call service option is set', async () => {
    const {seen, client} = makeCapturingClient()

    await client
      .call(
        app.bsky.actor.getProfile,
        {actor: HANDLE},
        {service: NOTIF_SERVICE},
      )
      .catch(() => {})

    expect(seen.length).toBe(1)
    expect(seen[0].headers.get('atproto-proxy')).toBe(NOTIF_SERVICE)
    /* the account origin is never the proxy target */
    expect(seen[0].headers.get('atproto-proxy')).not.toContain(SERVICE_ORIGIN)
  })
})
