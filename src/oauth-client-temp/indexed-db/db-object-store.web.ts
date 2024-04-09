import {DbIndexWeb} from './db-index.web'
import {ObjectStoreSchema} from './schema'
import {promisify} from './util'

export class DbObjectStoreWeb<Schema extends ObjectStoreSchema> {
  constructor(private idbObjStore: IDBObjectStore) {}

  get name() {
    return this.idbObjStore.name
  }

  index(name: string) {
    return new DbIndexWeb<Schema>(this.idbObjStore.index(name))
  }

  get(key: IDBValidKey | IDBKeyRange) {
    return promisify<Schema>(this.idbObjStore.get(key))
  }

  getKey(query: IDBValidKey | IDBKeyRange) {
    return promisify<IDBValidKey | undefined>(this.idbObjStore.getKey(query))
  }

  getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number) {
    return promisify<Schema[]>(this.idbObjStore.getAll(query, count))
  }

  getAllKeys(query?: IDBValidKey | IDBKeyRange | null, count?: number) {
    return promisify<IDBValidKey[]>(this.idbObjStore.getAllKeys(query, count))
  }

  add(value: Schema, key?: IDBValidKey) {
    return promisify(this.idbObjStore.add(value, key))
  }

  put(value: Schema, key?: IDBValidKey) {
    return promisify(this.idbObjStore.put(value, key))
  }

  delete(key: IDBValidKey | IDBKeyRange) {
    return promisify(this.idbObjStore.delete(key))
  }

  clear() {
    return promisify(this.idbObjStore.clear())
  }
}
