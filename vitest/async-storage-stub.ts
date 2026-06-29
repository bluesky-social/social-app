/*
 * Stub for @react-native-async-storage/async-storage. The real package
 * references `window` at module load, which is undefined in Vitest's node
 * environment. The package ships an official jest mock, but it relies on the
 * `jest` global, so we provide a small in-memory implementation instead.
 *
 * Aliased in place of @react-native-async-storage/async-storage via
 * resolve.alias in vitest.config.ts. Test-reachable code only uses
 * getItem/setItem/removeItem.
 */
const store = new Map<string, string>()

const AsyncStorage = {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(store.has(key) ? store.get(key)! : null)
  },
  setItem(key: string, value: string): Promise<void> {
    store.set(key, value)
    return Promise.resolve()
  },
  removeItem(key: string): Promise<void> {
    store.delete(key)
    return Promise.resolve()
  },
}

export default AsyncStorage
