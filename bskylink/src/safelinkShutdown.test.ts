import assert from 'node:assert'
import {describe, it} from 'node:test'

import {SafelinkClient} from './cache/safelinkClient.js'

const createClient = (getAgent: () => Promise<unknown>) => {
  const client: SafelinkClient = Object.create(SafelinkClient.prototype)
  Reflect.set(client, 'stopped', false)
  Reflect.set(client, 'ozoneAgent', {getAgent})
  return client
}

describe('Safelink shutdown', () => {
  it('clears a scheduled retry and cannot restart after stop', async () => {
    const client = createClient(async () => {
      throw new Error('Ozone unavailable')
    })

    await client.runFetchEvents()
    assert.ok(Reflect.get(client, 'fetchEventsTimeout'))

    await client.stop(1_000)
    assert.strictEqual(Reflect.get(client, 'fetchEventsTimeout'), undefined)
    assert.strictEqual(Reflect.get(client, 'stopped'), true)

    await client.runFetchEvents()
    assert.strictEqual(Reflect.get(client, 'fetchEventsTimeout'), undefined)
  })

  it('waits for an active poll to finish before stopping', async () => {
    let pollStarted = () => {}
    const started = new Promise<void>(resolve => {
      pollStarted = () => resolve(undefined)
    })
    let finishPoll = () => {}
    const releasePoll = new Promise<void>(resolve => {
      finishPoll = () => resolve(undefined)
    })
    const client = createClient(async () => {
      pollStarted()
      await releasePoll
      throw new Error('poll released during shutdown')
    })

    const polling = client.runFetchEvents()
    await started

    let stopped = false
    const stopping = client.stop(1_000).then(() => {
      stopped = true
    })
    await new Promise(resolve => setTimeout(resolve, 25))
    assert.strictEqual(stopped, false)

    finishPoll()
    await Promise.all([polling, stopping])
    assert.strictEqual(stopped, true)
  })

  it(
    'bounds the wait for a poll that never finishes',
    {timeout: 1_000},
    async () => {
      const client = createClient(() => new Promise<never>(() => {}))
      void client.runFetchEvents()

      const startedAt = Date.now()
      await client.stop(25)
      assert.ok(Date.now() - startedAt >= 20)
    },
  )

  it('retries a failed rule write without advancing the cursor', async () => {
    const client = createClient(async () => ({
      tools: {
        ozone: {
          safelink: {
            queryEvents: async () => ({
              data: {
                cursor: 'next',
                events: [
                  {
                    action: 'block',
                    createdAt: new Date().toISOString(),
                    eventType: 'addRule',
                    id: 1,
                    pattern: 'domain',
                    url: 'example.com',
                  },
                ],
              },
            }),
          },
        },
      },
    }))
    Reflect.set(client, 'cursor', 'current')
    Reflect.set(client, 'db', {
      transaction: async (run: (db: unknown) => Promise<void>) =>
        run({
          db: {
            insertInto: () => ({
              values: () => ({
                execute: async () => {
                  throw new Error('database unavailable')
                },
              }),
            }),
          },
        }),
    })

    await client.runFetchEvents()
    assert.ok(Reflect.get(client, 'fetchEventsTimeout'))
    assert.strictEqual(Reflect.get(client, 'cursor'), 'current')
    await client.stop(1_000)
  })
})
