import {DatabaseSchema} from '#/oauth-client-temp/indexed-db/schema'

export class Db<Schema extends DatabaseSchema> implements Disposable {
  static async open<Schema extends DatabaseSchema = DatabaseSchema>(
    dbname: string,
    migrations: ReadonlyArray<(db: IDBDatabase) => void>,
    txOptions?: IDBTransactionOptions,
  )
}
