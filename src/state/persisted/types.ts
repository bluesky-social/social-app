import type {Schema} from './schema'

export type PersistedApi = {
  init(): Promise<void>
  get<K extends keyof Schema>(key: K): Schema[K]
  write<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void>
  onUpdate(_cb: () => void): () => void
  clearStorage: () => Promise<void>
}
