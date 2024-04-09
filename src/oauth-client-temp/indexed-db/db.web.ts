import {DbTransactionWeb} from './db-transaction.web'
import {DatabaseSchema} from './schema'

export class Db<Schema extends DatabaseSchema> implements Disposable {
  static async open<Schema extends DatabaseSchema = DatabaseSchema>(
    dbName: string,
    migrations: ReadonlyArray<(db: IDBDatabase) => void>,
    txOptions?: IDBTransactionOptions,
  ) {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, migrations.length)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = ({oldVersion, newVersion}) => {
        const db = request.result
        try {
          for (
            let version = oldVersion;
            version < (newVersion ?? migrations.length);
            ++version
          ) {
            const migration = migrations[version]
            if (migration) migration(db)
            else throw new Error(`Missing migration for version ${version}`)
          }
        } catch (err) {
          db.close()
          reject(err)
        }
      }
    })

    return new DbWeb<Schema>(db, txOptions)
  }

  #db: null | IDBDatabase

  constructor(
    db: IDBDatabase,
    protected readonly txOptions?: IDBTransactionOptions,
  ) {
    this.#db = db

    const cleanup = () => {
      this.#db = null
      db.removeEventListener('versionchange', cleanup)
      db.removeEventListener('close', cleanup)
      db.close() // Can we call close on a "closed" database?
    }

    db.addEventListener('versionchange', cleanup)
    db.addEventListener('close', cleanup)
  }

  protected get db(): IDBDatabase {
    if (!this.#db) throw new Error('Database closed')
    return this.#db
  }

  get name() {
    return this.db.name
  }

  get objectStoreNames() {
    return this.db.objectStoreNames
  }

  get version() {
    return this.db.version
  }

  async transaction<T extends readonly (keyof Schema & string)[], R>(
    storeNames: T,
    mode: IDBTransactionMode,
    run: (tx: DbTransactionWeb<Pick<Schema, T[number]>>) => R | PromiseLike<R>,
  ): Promise<R> {
    return new Promise<R>(async (resolve, reject) => {
      try {
        const tx = this.db.transaction(storeNames, mode, this.txOptions)
        let result: {done: false} | {done: true; value: R} = {done: false}

        tx.oncomplete = () => {
          if (result.done) resolve(result.value)
          else reject(new Error('Transaction completed without result'))
        }
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'))

        try {
          const value = await run(new DbTransactionWeb(tx))
          result = {done: true, value}
          tx.commit()
        } catch (err) {
          tx.abort()
          throw err
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  close() {
    const {db} = this
    this.#db = null
    db.close()
  }

  [Symbol.dispose]() {
    if (this.#db) return this.close()
  }
}
