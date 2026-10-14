import assert from 'node:assert'
import {describe, it} from 'node:test'

import {SafelinkClient} from './cache/safelinkClient.js'

const createClient = (storedCursor: string | undefined) => {
  const client: SafelinkClient = Object.create(SafelinkClient.prototype)
  const requestedCursors: Array<string | undefined> = []

  Reflect.set(client, 'stopped', false)
  Reflect.set(client, 'ozoneAgent', {
    getAgent: () =>
      Promise.resolve({
        tools: {
          ozone: {
            safelink: {
              queryEvents: ({cursor}: {cursor?: string}) => {
                requestedCursors.push(cursor)
                return Promise.resolve({data: {events: []}})
              },
            },
          },
        },
      }),
  })
  Reflect.set(client, 'db', {
    db: {
      selectFrom: () => ({
        selectAll: () => ({
          where: () => ({
            executeTakeFirst: () =>
              Promise.resolve(
                storedCursor === undefined
                  ? undefined
                  : {id: 1, cursor: storedCursor},
              ),
          }),
        }),
      }),
    },
  })

  return {client, requestedCursors}
}

void describe('Safelink cursor', () => {
  void it('resumes from the stored cursor on startup', async () => {
    const {client, requestedCursors} = createClient('42')

    await client.runFetchEvents()
    try {
      assert.deepStrictEqual(requestedCursors, ['42'])
    } finally {
      await client.stop(1_000)
    }
  })

  void it('starts from the beginning when no cursor is stored', async () => {
    const {client, requestedCursors} = createClient(undefined)

    await client.runFetchEvents()
    try {
      assert.deepStrictEqual(requestedCursors, [''])
    } finally {
      await client.stop(1_000)
    }
  })
})
