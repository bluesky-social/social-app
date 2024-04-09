import {ObjectStoreSchema} from './schema'
import {promisify} from './util'

export class DbIndexWeb<Schema extends ObjectStoreSchema> {
  constructor(private idbIndex: IDBIndex) {}

  count(query?: IDBValidKey | IDBKeyRange) {
    return promisify(this.idbIndex.count(query))
  }

  get(query: IDBValidKey | IDBKeyRange) {
    return promisify<Schema>(this.idbIndex.get(query))
  }

  getKey(query: IDBValidKey | IDBKeyRange) {
    return promisify(this.idbIndex.getKey(query))
  }

  getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number) {
    return promisify<Schema[]>(this.idbIndex.getAll(query, count))
  }

  getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number) {
    return promisify(this.idbIndex.getAllKeys(query, count))
  }

  deleteAll(query?: IDBValidKey | IDBKeyRange | null): Promise<void> {
    return new Promise((resolve, reject) => {
      const result = this.idbIndex.openCursor(query)
      result.onsuccess = function (event) {
        const cursor = (event as any).target.result as IDBCursorWithValue
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      result.onerror = function (event) {
        reject((event.target as any)?.error || new Error('Unexpected error'))
      }
    })
  }
}
