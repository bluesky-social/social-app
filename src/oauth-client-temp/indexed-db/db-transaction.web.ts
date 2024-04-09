import {DbObjectStoreWeb} from './db-object-store.web'
import {DatabaseSchema} from './schema'

export class DbTransactionWeb<Schema extends DatabaseSchema>
  implements Disposable
{
  #tx: IDBTransaction | null

  constructor(tx: IDBTransaction) {
    this.#tx = tx

    const onAbort = () => {
      cleanup()
    }
    const onComplete = () => {
      cleanup()
    }
    const cleanup = () => {
      this.#tx = null
      tx.removeEventListener('abort', onAbort)
      tx.removeEventListener('complete', onComplete)
    }
    tx.addEventListener('abort', onAbort)
    tx.addEventListener('complete', onComplete)
  }

  protected get tx(): IDBTransaction {
    if (!this.#tx) throw new Error('Transaction already ended')
    return this.#tx
  }

  async abort() {
    const {tx} = this
    this.#tx = null
    tx.abort()
  }

  async commit() {
    const {tx} = this
    this.#tx = null
    tx.commit?.()
  }

  objectStore<T extends keyof Schema & string>(name: T) {
    const store = this.tx.objectStore(name)
    return new DbObjectStoreWeb<Schema[T]>(store)
  }

  [Symbol.dispose](): void {
    if (this.#tx) this.commit()
  }
}
