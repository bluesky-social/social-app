import assert from 'node:assert'
import events from 'node:events'
import http from 'node:http'
import {describe, it} from 'node:test'

import {createHttpTerminator} from 'http-terminator'

import {REQUEST_DRAIN_TIMEOUT_MS} from './shutdown.js'

describe('HTTP shutdown', () => {
  it('allows in-flight requests to finish during the drain window', async () => {
    let beginRequest = () => {}
    const requestStarted = new Promise<void>(resolve => {
      beginRequest = () => resolve(undefined)
    })
    let finishRequest = () => {}
    const releaseRequest = new Promise<void>(resolve => {
      finishRequest = () => resolve(undefined)
    })

    const server = http.createServer(async (_req, res) => {
      beginRequest()
      await releaseRequest
      res.end('finished')
    })
    server.listen(0, '127.0.0.1')
    await events.once(server, 'listening')

    const address = server.address()
    assert.ok(address && typeof address !== 'string')

    const responsePromise = fetch(`http://127.0.0.1:${address.port}`)
    await requestStarted

    const terminator = createHttpTerminator({
      server,
      gracefulTerminationTimeout: REQUEST_DRAIN_TIMEOUT_MS,
    })
    let termination: Promise<void> | undefined
    try {
      let terminated = false
      termination = terminator.terminate().then(() => {
        terminated = true
      })

      await new Promise(resolve => setTimeout(resolve, 25))
      assert.strictEqual(terminated, false)

      finishRequest()
      const response = await responsePromise
      assert.strictEqual(await response.text(), 'finished')
      await termination
      assert.strictEqual(terminated, true)
    } finally {
      finishRequest()
      await (termination ?? terminator.terminate())
    }
  })

  it('uses the shared 60 second request drain budget', () => {
    assert.strictEqual(REQUEST_DRAIN_TIMEOUT_MS, 60_000)
  })
})
