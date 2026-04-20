/**
 * Web and Node test environments: standard `fetch`.
 * Native uses `index.native.ts` (react-native-nitro-fetch).
 */
export const fetch: typeof globalThis.fetch = globalThis.fetch.bind(globalThis)
