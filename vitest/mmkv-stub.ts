/*
 * Stub for @bsky.app/react-native-mmkv. The real package binds to a native
 * module and imports `react-native`, neither of which works under Vitest's
 * node environment. Tests that exercise storage logic mock this module's MMKV
 * with their own in-memory implementation; this stub just provides a class
 * shape so transitive importers (e.g. #/storage) load without booting RN.
 *
 * Aliased in place of @bsky.app/react-native-mmkv via resolve.alias in
 * vitest.config.ts.
 */
export class MMKV {
  getString() {
    return undefined
  }
  set() {}
  delete() {}
  getAllKeys(): string[] {
    return []
  }
  clearAll() {}
  addOnValueChangedListener() {
    return {remove() {}}
  }
}
