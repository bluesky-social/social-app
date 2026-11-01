import assert from 'node:assert'
import {describe, it} from 'node:test'

import {SafelinkClient} from './cache/safelinkClient.js'
import {type SafelinkRule} from './db/schema.js'

const createClient = (events: SafelinkRule[]) => {
  const client: SafelinkClient = Object.create(SafelinkClient.prototype)
  const deletes: Array<Array<[string, string, unknown]>> = []
  const clearedCaches: Array<['domain' | 'url', string]> = []

  const deleteQuery = (wheres: Array<[string, string, unknown]>) => ({
    where: (column: string, op: string, value: unknown) =>
      deleteQuery([...wheres, [column, op, value]]),
    execute: () => {
      deletes.push(wheres)
      return Promise.resolve()
    },
  })

  Reflect.set(client, 'stopped', false)
  Reflect.set(client, 'cursor', 'current')
  Reflect.set(client, 'domainCache', {
    delete: (key: string) => clearedCaches.push(['domain', key]),
  })
  Reflect.set(client, 'urlCache', {
    delete: (key: string) => clearedCaches.push(['url', key]),
  })
  Reflect.set(client, 'ozoneAgent', {
    getAgent: () =>
      Promise.resolve({
        tools: {
          ozone: {
            safelink: {
              queryEvents: () => Promise.resolve({data: {cursor: '', events}}),
            },
          },
        },
      }),
  })
  Reflect.set(client, 'db', {
    transaction: (run: (db: unknown) => Promise<void>) =>
      run({db: {deleteFrom: () => deleteQuery([])}}),
  })

  return {client, deletes, clearedCaches}
}

const removeEvent = (
  pattern: SafelinkRule['pattern'],
  url: string,
): SafelinkRule => ({
  id: 1,
  eventType: 'removeRule',
  url,
  pattern,
  action: 'block',
  createdAt: new Date().toISOString(),
})

void describe('Safelink removeRule', () => {
  void it('deletes a url rule by its own pattern', async () => {
    const {client, deletes, clearedCaches} = createClient([
      removeEvent('url', 'https://Example.com/Phishing/'),
    ])

    await client.runFetchEvents()
    try {
      assert.deepStrictEqual(deletes, [
        [
          ['pattern', '=', 'url'],
          ['url', '=', 'example.com/phishing'],
        ],
      ])
      assert.deepStrictEqual(clearedCaches, [['url', 'example.com/phishing']])
    } finally {
      await client.stop(1_000)
    }
  })

  void it('deletes a domain rule by its own pattern', async () => {
    const {client, deletes, clearedCaches} = createClient([
      removeEvent('domain', 'https://Example.com/anything'),
    ])

    await client.runFetchEvents()
    try {
      assert.deepStrictEqual(deletes, [
        [
          ['pattern', '=', 'domain'],
          ['url', '=', 'example.com'],
        ],
      ])
      assert.deepStrictEqual(clearedCaches, [['domain', 'example.com']])
    } finally {
      await client.stop(1_000)
    }
  })
})
