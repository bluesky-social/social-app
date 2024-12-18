import {DBSchema, IDBPDatabase, openDB} from 'idb'

import {DraftEntry, UnknownDraftEntry} from './database.types'

interface DraftDBSchema extends DBSchema {
  drafts: {
    key: string
    value: {
      id: string
      createdAt: number
      state: unknown
    }
  }
}

let _db: Promise<IDBPDatabase<DraftDBSchema>> | undefined
const openDraftDb = () => {
  if (_db === undefined) {
    _db = openDB<DraftDBSchema>('bsky-drafts', 1, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          database.createObjectStore('drafts', {keyPath: 'id'})
        }
      },
    }).catch(err => {
      _db = undefined
      return Promise.reject(err)
    })
  }

  return _db
}

export const listDrafts = async ({
  cursor,
  limit = 50,
}: {
  limit?: number
  cursor?: string
}): Promise<{cursor: string | undefined; entries: UnknownDraftEntry[]}> => {
  const db = await openDraftDb()

  const tx = db.transaction('drafts', 'readonly')

  const range = cursor ? IDBKeyRange.upperBound(cursor, true) : undefined
  const curs = tx.store.iterate(range, 'prev')

  const items = await toArray(
    take(
      map(curs, c => c.value),
      limit,
    ),
  )

  return {
    cursor: items.length >= limit ? items[items.length - 1].id : undefined,
    entries: items,
  }
}

export const putDraft = async (entry: DraftEntry): Promise<void> => {
  const db = await openDraftDb()
  await db.put('drafts', entry)
}

export const removeDraft = async (entryId: string): Promise<void> => {
  const db = await openDraftDb()
  await db.delete('drafts', entryId)
}

async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const array: T[] = []

  for await (const value of iterable) {
    array.push(value)
  }

  return array
}

async function* map<T, S>(
  iterable: AsyncIterable<T>,
  mapper: (value: T) => S,
): AsyncGenerator<S> {
  for await (const value of iterable) {
    yield mapper(value)
  }
}

async function* take<T>(
  iterable: AsyncIterable<T>,
  amount: number,
): AsyncGenerator<T> {
  let count = 0

  for await (const value of iterable) {
    yield value

    if (++count >= amount) {
      break
    }
  }
}
