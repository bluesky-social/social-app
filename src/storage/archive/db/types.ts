type MaybePromise<T> = T | Promise<T>
export type DB = {
  get(key: string): MaybePromise<string | undefined>
  set(key: string, value: string): MaybePromise<void>
  delete(key: string): MaybePromise<void>
  clear(): MaybePromise<void>
}
